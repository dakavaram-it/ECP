import os
from pathlib import Path

import pymysql
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    allow_methods=["GET", "POST"],
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


def insert(sql, args=None):
    conn = pymysql.connect(**DB)
    try:
        with conn.cursor() as cur:
            cur.execute(sql, args)
        conn.commit()
        return cur.lastrowid
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


@app.get("/S5getProposalConstituenciesByTehsilId")
def get_proposal_constituencies_by_tehsil_id(
    constituency_id: int, tehsil_id: int, proposal_election_type_id: int
):
    return query(
        "SELECT PC.proposal_consituency_id, C.name AS constituency_name "
        "FROM proposal_consituency PC "
        "JOIN constituency C ON PC.constituency_id = C.constituency_id "
        "JOIN user_address UA ON PC.address_id = UA.user_address_id "
        "WHERE PC.proposal_election_type_id = %s AND "
        "UA.constituency_id = %s AND UA.tehsil_id = %s AND PC.enrollment_id = 1",
        (proposal_election_type_id, constituency_id, tehsil_id),
    )


@app.get("/S6getProposalConstituenciesByTownId")
def get_proposal_constituencies_by_town_id(
    constituency_id: int, town_id: int, proposal_election_type_id: int
):
    return query(
        "SELECT PC.proposal_consituency_id, C.name AS constituency_name "
        "FROM proposal_consituency PC "
        "JOIN constituency C ON PC.constituency_id = C.constituency_id "
        "JOIN user_address UA ON PC.address_id = UA.user_address_id "
        "WHERE PC.proposal_election_type_id = %s AND "
        "UA.constituency_id = %s AND UA.local_election_body = %s AND PC.enrollment_id = 1",
        (proposal_election_type_id, constituency_id, town_id),
    )


@app.get("/S7getProposalPositionsOverviewByProposalConstituencyId")
def get_proposal_positions_overview_by_proposal_constituency_id(
    proposal_constituency_id: int,
):
    return query(
        "SELECT PP.proposal_position_id, PR.proposal_role_id, PR.role_name, "
        "PP.max_positions, PP.max_proposals, "
        "COUNT(DISTINCT PC.tdp_cadre_id) AS proposed_cnt "
        "FROM proposal_position PP "
        "JOIN proposal_role PR ON PP.proposal_role_id = PR.proposal_role_id "
        "LEFT OUTER JOIN proposal_candidate PC "
        "ON PP.proposal_position_id = PC.proposal_position_id AND PC.is_active = 'Y' "
        "WHERE PP.proposal_constituency_id = %s "
        "GROUP BY PP.proposal_position_id, PR.proposal_role_id, PR.role_name, "
        "PP.max_positions, PP.max_proposals, PR.order_no "
        "ORDER BY PR.order_no",
        (proposal_constituency_id,),
    )


@app.get("/S8getProposalPositionsByProposalConstituencyId")
def get_proposal_positions_by_proposal_constituency_id(proposal_constituency_id: int):
    return query(
        "SELECT PP.proposal_position_id, PR.role_name "
        "FROM proposal_position PP "
        "JOIN proposal_role PR ON PP.proposal_role_id = PR.proposal_role_id "
        "WHERE PP.proposal_constituency_id = %s ORDER BY PR.order_no",
        (proposal_constituency_id,),
    )


@app.get("/S9getProposalConstituencyReservation")
def get_proposal_constituency_reservation(proposal_constituency_id: int):
    return query(
        "SELECT CR.constituency_reservation_id, CR.reservation_type "
        "FROM proposal_consituency PC "
        "JOIN constituency_reservation CR "
        "ON PC.constituency_reservation_id = CR.constituency_reservation_id "
        "WHERE PC.proposal_consituency_id = %s",
        (proposal_constituency_id,),
    )


@app.get("/S10checkProposalPositionAvailability")
def check_proposal_position_availability(proposal_position_id: int):
    return query(
        "SELECT CASE WHEN PP.max_proposals > COUNT(DISTINCT PC.tdp_cadre_id) "
        "THEN 'Available' ELSE 'Not Available' END AS availability "
        "FROM proposal_position PP "
        "LEFT OUTER JOIN proposal_candidate PC "
        "ON PP.proposal_position_id = PC.proposal_position_id AND PC.is_active = 'Y' "
        "WHERE PP.proposal_position_id = %s",
        (proposal_position_id,),
    )


class AssignProposalCandidate(BaseModel):
    proposal_position_id: int
    tdp_cadre_id: int


@app.post("/S11assignProposalCandidate")
def assign_proposal_candidate(body: AssignProposalCandidate):
    position = query(
        "SELECT PP.max_proposals, CR.reservation_type, "
        "CR.caste_category_id AS required_caste_category_id, "
        "CR.gender AS required_gender "
        "FROM proposal_position PP "
        "JOIN proposal_consituency PCon "
        "ON PP.proposal_constituency_id = PCon.proposal_consituency_id "
        "LEFT OUTER JOIN constituency_reservation CR "
        "ON PCon.constituency_reservation_id = CR.constituency_reservation_id "
        "WHERE PP.proposal_position_id = %s",
        (body.proposal_position_id,),
    )
    if not position:
        raise HTTPException(404, "Unknown proposal_position_id")
    position = position[0]

    cadre = query(
        "SELECT TC.gender, CCG.caste_category_id "
        "FROM tdp_cadre TC "
        "LEFT OUTER JOIN caste_state CS ON TC.caste_state_id = CS.caste_state_id "
        "LEFT OUTER JOIN caste_category_group CCG "
        "ON CS.caste_category_group_id = CCG.caste_category_group_id "
        "WHERE TC.tdp_cadre_id = %s",
        (body.tdp_cadre_id,),
    )
    if not cadre:
        raise HTTPException(404, "Unknown tdp_cadre_id")
    cadre = cadre[0]

    # required_caste_category_id / required_gender are NULL when the proposal
    # constituency has no reservation, which means anyone is eligible.
    if position["required_caste_category_id"] is not None:
        if cadre["caste_category_id"] is None:
            raise HTTPException(409, "Cadre has no caste category on record")
        if cadre["caste_category_id"] != position["required_caste_category_id"]:
            raise HTTPException(
                409, f"Position is reserved for {position['reservation_type']}"
            )
    if position["required_gender"] == "F" and cadre["gender"] != "F":
        raise HTTPException(
            409, f"Position is reserved for {position['reservation_type']}"
        )

    if check_proposal_position_availability(body.proposal_position_id)[0][
        "availability"
    ] != "Available":
        raise HTTPException(409, "Position has reached max_proposals")

    already = query(
        "SELECT proposal_candidate_id FROM proposal_candidate "
        "WHERE proposal_position_id = %s AND tdp_cadre_id = %s AND is_active = 'Y'",
        (body.proposal_position_id, body.tdp_cadre_id),
    )
    if already:
        raise HTTPException(409, "Cadre is already proposed for this position")

    proposal_candidate_id = insert(
        "INSERT INTO proposal_candidate "
        "(proposal_position_id, tdp_cadre_id, is_active, enrollment_id, inserted_time) "
        "VALUES (%s, %s, 'Y', 1, NOW())",
        (body.proposal_position_id, body.tdp_cadre_id),
    )
    return {"proposal_candidate_id": proposal_candidate_id}


CADRE_SEARCH_FILTERS = {
    "MembershipId": "TC.membership_id = %s",
    "MobileNo": "TC.mobile_no = %s",
    "Name": "TC.first_name LIKE %s",
}

@app.get("/S12cadreSearch")
def cadre_search(constituency_id: int, search_type: str, search_value: str):
    if search_type not in CADRE_SEARCH_FILTERS:
        raise HTTPException(
            400, "search_type must be one of MembershipId, MobileNo, Name"
        )
    value = f"%{search_value}%" if search_type == "Name" else search_value

    return query(
        "SELECT TC.tdp_cadre_id, TC.membership_id, TC.first_name AS member_name, "
        "TC.gender, TC.age, TC.relative_name, TC.relative_type, TC.mobile_no, "
        "CC.category_name, CT.caste_name, C.constituency_id, C.name AS constituency_name, "
        "CASE WHEN T.tehsil_id IS NOT NULL THEN T.tehsil_name "
        "ELSE CONCAT(L.name, ' Town') END AS mandal_town_name, "
        "P.panchayat_name, V.voter_id_card_no, "
        "CASE WHEN TC.image IS NOT NULL "
        "THEN CONCAT('https://imagesearch-projectkv.s3.amazonaws.com/cadre_images/', TC.image) "
        "ELSE '' END AS img_url "
        "FROM tdp_cadre TC "
        "JOIN user_address UA ON TC.address_id = UA.user_address_id "
        "JOIN constituency C ON UA.constituency_id = C.constituency_id "
        "LEFT OUTER JOIN tehsil T ON UA.tehsil_id = T.tehsil_id "
        "LEFT OUTER JOIN local_election_body L ON UA.local_election_body = L.local_election_body_id "
        "LEFT OUTER JOIN panchayat P ON UA.panchayat_id = P.panchayat_id "
        "LEFT OUTER JOIN caste_state CS ON TC.caste_state_id = CS.caste_state_id "
        "LEFT OUTER JOIN caste CT ON CS.caste_id = CT.caste_id "
        "LEFT OUTER JOIN caste_category_group CCG "
        "ON CS.caste_category_group_id = CCG.caste_category_group_id "
        "LEFT OUTER JOIN caste_category CC ON CCG.caste_category_id = CC.caste_category_id "
        "LEFT OUTER JOIN voter V ON TC.voter_id = V.voter_id "
        "WHERE TC.is_deleted = 'N' AND C.constituency_id = %s AND "
        + CADRE_SEARCH_FILTERS[search_type],
        (constituency_id, value),
    )


@app.get("/S13getProposalCandidatesByProposalPositionId")
def get_proposal_candidates_by_proposal_position_id(proposal_position_id: int):
    return query(
        "SELECT PC.proposal_candidate_id, TC.tdp_cadre_id, TC.membership_id, "
        "TC.first_name AS member_name, TC.gender, TC.age, TC.relative_name, "
        "TC.relative_type, TC.mobile_no, CC.category_name, CT.caste_name, "
        "C.constituency_id, C.name AS constituency_name, "
        "CASE WHEN T.tehsil_id IS NOT NULL THEN T.tehsil_name "
        "ELSE CONCAT(L.name, ' Town') END AS mandal_town_name, "
        "P.panchayat_name, V.voter_id_card_no, "
        "CASE WHEN TC.image IS NOT NULL "
        "THEN CONCAT('https://imagesearch-projectkv.s3.amazonaws.com/cadre_images/', TC.image) "
        "ELSE '' END AS img_url "
        "FROM proposal_candidate PC "
        "JOIN tdp_cadre TC ON PC.tdp_cadre_id = TC.tdp_cadre_id "
        "JOIN user_address UA ON TC.address_id = UA.user_address_id "
        "JOIN constituency C ON UA.constituency_id = C.constituency_id "
        "LEFT OUTER JOIN tehsil T ON UA.tehsil_id = T.tehsil_id "
        "LEFT OUTER JOIN local_election_body L ON UA.local_election_body = L.local_election_body_id "
        "LEFT OUTER JOIN panchayat P ON UA.panchayat_id = P.panchayat_id "
        "LEFT OUTER JOIN caste_state CS ON TC.caste_state_id = CS.caste_state_id "
        "LEFT OUTER JOIN caste CT ON CS.caste_id = CT.caste_id "
        "LEFT OUTER JOIN caste_category_group CCG "
        "ON CS.caste_category_group_id = CCG.caste_category_group_id "
        "LEFT OUTER JOIN caste_category CC ON CCG.caste_category_id = CC.caste_category_id "
        "LEFT OUTER JOIN voter V ON TC.voter_id = V.voter_id "
        "WHERE PC.proposal_position_id = %s AND PC.is_active = 'Y' "
        "ORDER BY PC.proposal_candidate_id",
        (proposal_position_id,),
    )
