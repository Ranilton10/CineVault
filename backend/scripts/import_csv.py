
import csv
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATABASE = ROOT / "backend" / "rocketlab.db"
DATA = ROOT / "data"

FILES = [
    ("bases-1/bases_atv_dev1/dim_movies.csv", "dim_movies"),
    ("bases-1/bases_atv_dev1/dim_companies.csv", "dim_companies"),
    ("bases-1/bases_atv_dev1/dim_genres.csv", "dim_genres"),
    ("bases-1/bases_atv_dev1/dim_people.csv", "dim_people"),
    ("bases-1/bases_atv_dev1/dim_reviews.csv", "dim_reviews"),
    ("bases-2/bases_atv_dev_2/bridge_movie_company.csv",
     "bridge_movie_company"),
    ("bases-2/bases_atv_dev_2/bridge_movie_genre.csv",
     "bridge_movie_genre"),
    ("bases-2/bases_atv_dev_2/bridge_movie_person.csv",
     "bridge_movie_person"),
    ("bases-2/bases_atv_dev_2/fact_movies_performance.csv",
     "fact_movies_performance"),
    ("bases-2/bases_atv_dev_2/movies_reviews.csv", "movie_reviews"),
]

BATCH_SIZE = 2000


def import_csv(conn, path, table):
    total = 0

    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        columns = reader.fieldnames

        if not columns:
            raise ValueError(f"CSV sem colunas: {path}")

        db_columns = {
            row[1]
            for row in conn.execute(f'PRAGMA table_info("{table}")')
        }

        if not set(columns).issubset(db_columns):
            raise ValueError(f"Colunas incompatíveis: {table}")

        names = ", ".join(f'"{column}"' for column in columns)
        placeholders = ", ".join("?" for _ in columns)

        sql = (
            f'INSERT INTO "{table}" ({names}) '
            f"VALUES ({placeholders})"
        )

        batch = []

        for row in reader:
            values = tuple(
                row[column] if row[column] != "" else None
                for column in columns
            )

            batch.append(values)

            if len(batch) >= BATCH_SIZE:
                conn.executemany(sql, batch)
                total += len(batch)
                batch.clear()

        if batch:
            conn.executemany(sql, batch)
            total += len(batch)

    print(f"{table}: {total} registros importados")
    return total


def main():
    if not DATABASE.is_file():
        raise FileNotFoundError(
            "Banco não encontrado. Execute primeiro as migrações."
        )

    for filename, _ in FILES:
        path = DATA / filename

        if not path.is_file():
            raise FileNotFoundError(f"Arquivo não encontrado: {path}")

    conn = sqlite3.connect(DATABASE)

    try:
        conn.execute("PRAGMA foreign_keys = ON")

        for _, table in FILES:
            count = conn.execute(
                f'SELECT COUNT(*) FROM "{table}"'
            ).fetchone()[0]

            if count > 0:
                raise RuntimeError(
                    f"A tabela {table} já contém dados. "
                    "Importação cancelada para evitar duplicações."
                )

        total = 0

        with conn:
            for filename, table in FILES:
                total += import_csv(conn, DATA / filename, table)

            errors = conn.execute(
                "PRAGMA foreign_key_check"
            ).fetchall()

            if errors:
                raise RuntimeError(
                    f"Foram encontrados {len(errors)} erros "
                    "de relacionamento."
                )

        print(f"\nImportação concluída: {total} registros.")

    finally:
        conn.close()


if __name__ == "__main__":
    main()

