import os
from pathlib import Path

import pymysql
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def env(key):
    value = os.environ.get(key)
    if not value:
        raise RuntimeError(
            f"{key} is not set. Copy .env.example to .env in the project root "
            f"and fill in the database credentials."
        )
    return value


DB = {
    "host": env("DB_HOST"),
    "port": int(env("DB_PORT")),
    "user": env("DB_USER"),
    "password": env("DB_PASSWORD"),
    "database": env("DB_NAME"),
    "cursorclass": pymysql.cursors.DictCursor,
}

app = FastAPI(title="Local Body Elections API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9001", "http://127.0.0.1:9001"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def query(sql, args=None):
    conn = pymysql.connect(**DB)
    try:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            return cur.fetchall()
    finally:
        conn.close()


@app.get("/S1getProposalElectionTypes")
def get_proposal_election_types():
    return query(
        "SELECT proposal_election_type_id, election_type "
        "FROM proposal_election_type WHERE is_active = 'Y' ORDER BY order_no"
    )


@app.get("/S2getAssemblyConstituenciesInAState")
def get_assembly_constituencies_in_a_state():
    return query(
        "SELECT C.constituency_id, C.name AS constituency_name "
        "FROM constituency C, election_scope ES "
        "WHERE C.election_scope_id = ES.election_scope_id AND "
        "ES.election_type_id = 2 AND C.state_id = 1 AND "
        "C.deform_date IS NULL ORDER BY C.name"
    )


@app.get("/S3getMandalsInAConstituency")
def get_mandals_in_a_constituency(constituency_id: int):
    return query(
        "SELECT T.tehsil_id, T.tehsil_name "
        "FROM tehsil_constituency TC, tehsil T "
        "WHERE TC.tehsil_id = T.tehsil_id AND TC.constituency_id = %s "
        "ORDER BY T.tehsil_name",
        (constituency_id,),
    )


@app.get("/S4getTownsInAConstituency")
def get_towns_in_a_constituency(constituency_id: int):
    return query(
        "SELECT L.local_election_body_id AS town_id, CONCAT(L.name, ' Town') AS town_name "
        "FROM assembly_local_election_body AL, local_election_body L "
        "WHERE AL.local_election_body_id = L.local_election_body_id AND "
        "AL.constituency_id = %s ORDER BY L.name",
        (constituency_id,),
    )
