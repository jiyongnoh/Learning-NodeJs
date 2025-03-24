// BiMap 클래스 정의
class BiMap {
  forward = new Map();
  reverse = new Map();

  constructor(entries = []) {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  set(key, value) {
    this.forward.set(key, value);
    this.reverse.set(value, key);
  }

  get(key) {
    return this.forward.get(key);
  }

  getKey(value) {
    return this.reverse.get(value);
  }

  delete(key) {
    const value = this.forward.get(key);
    this.forward.delete(key);
    this.reverse.delete(value);
  }

  has(key) {
    return this.forward.has(key);
  }

  hasValue(value) {
    return this.reverse.has(value);
  }
}

// careers 객체
const careers = {
  1: "fitness_trainer",
  2: "aircraft_pilot",
  3: "auto_mechanic",
  4: "cinematographer",
  5: "cook_and_head_chef",
  6: "confectioner",
  7: "barista",
  8: "firefighter",
  9: "police_officer",
  10: "career_soldier",
  11: "athlete",
  12: "doctor",
  13: "veterinarian",
  14: "computer_programmer",
  15: "automotive_engineer",
  16: "robotics_engineer",
  17: "aerospace_engineer",
  18: "institute_of_mathematics_and_statistics",
  19: "life_science_research_institute",
  20: "university_professor",
  21: "profiler",
  22: "singer",
  23: "actor",
  24: "dancer",
  25: "artist",
  26: "cartoonist",
  27: "author",
  28: "performer",
  29: "fashion_designer",
  30: "hair_designer",
  31: "make_up_artist",
  32: "pet_groomer",
  33: "youtube_creator",
  34: "counseling_psychologist",
  35: "social_worker",
  36: "nurse",
  37: "physical_therapist",
  38: "kindergarten_teacher",
  39: "elementary_and_secondary_school_teachers",
  40: "priest",
  41: "recreation_coordinator",
  42: "tour_guide",
  43: "flight_attendant",
  44: "salesman",
  45: "management_consultant",
  46: "stockbroker",
  47: "lawyer",
  48: "diplomat",
  49: "member_of_congress",
  50: "reporter",
  51: "broadcast_director",
  52: "movie_director",
  53: "advertising_planner",
  54: "record_producer",
  55: "public_official",
  56: "librarian",
  57: "professional_secretary",
  58: "accountant",
  59: "tax_accountant",
  60: "bank_clerk",
  61: "insurance_agent",
  62: "air_traffic_controller",
  63: "information_security_specialist",
  64: "clinical_pathologist",
};

// BiMap 인스턴스 생성 (초기화 시 entries 전달)
const careerBiMap = new BiMap(
  Object.entries(careers).map(([k, v]) => [Number(k), v])
);

// export
module.exports = { careerBiMap };
