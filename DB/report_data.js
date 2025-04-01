const ebtResultMap = {
  양호: "img_result_1.png",
  주의: "img_result_2.png",
  경고: "img_result_3.png",
  default: "img_result_2.png",
};
const ptResultMap = {
  E: "아동은 이성형보다는 감정형에 가깝습니다. 감정형은 감수성이 풍부하고 감정이 드러나기 쉬운 특질을 말합니다. 감정형은 뜨거움과 열정을 상징하는 불에 비유할 수 있습니다.",
  R: "아동은 감정형보다 이성형에 가깝습니다. 이성형은 감정보다는 이성적 판단이 앞서고 침착한 특질을 말합니다. 이성형은 차가움과 침착함을 상징하는 물에 비유할 수 있습니다.",
  C: "아동은 신중형보다는 용기형에 가깝습니다. 용기형은 위험이나 처벌이 예상되는 상황에서도 낙천적으로 생각하고 위축되지 않는 용기를 보이는 특질을 말합니다. 용기형은 과감한 용기를 상징하는 칼에 비유할 수 있습니다.",
  P: "아동은 용기형보다 신중형에 가깝습니다. 신중형은 위험과 실패를 대비하여 행동을 미리 조심할 줄 아는 신중한 특질을 말합니다. 신중형은 자기보호와 신중성을 상징하는 방패에 비유할 수 있습니다.",
  F: "아동은 개방형보다 안정형에 가깝습니다. 안정형은 익숙하고 예측이 되는 대상이나 환경을 선호하고 안정을 추구하는 특질을 말합니다. 안정형은 익숙하고 편안한 집에 비유할 수 있습니다.",
  O: "아동은 안정형보다는 개방형에 가깝습니다. 개방형은 새로운 자극에 마음이 열려 있고 모험을 즐기는 특질을 말합니다. 개방형은 새로운 자극이 많아 모험을 펼칠 수 있는 들판에 비유할 수 있습니다.",
  I: "아동은 관계형보다 독립형에 가깝습니다. 독립형은 독립적으로 활동하는 것을 선호하는 특질을 말합니다. 독립형은 독립적인 생활을 추구하는 고양이에 비유할 수 있습니다.",
  S: "아동은 독립형보다는 관계형에 가깝습니다. 관계형은 다른 사람들과 어울리며 관계 맺는 것을 좋아하는 특질을 말합니다. 관계형은 사람을 좋아하는 강아지에 비유할 수 있습니다.",
  default: "성격 검사 미실시",
};
const friendMap = {
  FTH: {
    category: "좋은 친구형",
    ment: "배려심 있고 협동을 잘 하며 사람들과 어울리기 좋아하는 유형이에요. 친구 이야기를 잘 들어주고, 기쁘거나 슬픈 일에 공감을 잘 해요. 내 의견을 고집하기보다 어디에나 잘 어울리고, 대부분의 아이들과 잘 지낼 수 있어요. 다른 아이들에게 편안하고 좋은 친구가 되어줄 수 있어요.",
  },
  FSH: {
    category: "은근한 개인주의자형",
    ment: "혼자 있을 때 편하지만 드러내지 않고 남들에게 잘 맞춰주는 유형이에요. 친구들의 제안을 잘 따르고 큰 불만 없이 아이들과 무리를 지어 잘 지낼 수 있어요. 하지만 다른 사람의 감정에 둔하고, 다정하기보다는 무뚝뚝한 편이고, 혼자 있어도 불편하지 않아요.",
  },
  LTH: {
    category: "인싸 리더형",
    ment: "리더십있고 친구들에게 인기 있는 유형이에요. 내가 좋아하는 놀이를 하고, 내가 원하는 방식으로 상황을 이끌어가는 것을 좋아해요. 동시에 친구들의 감정도 잘 알아차리고 함께 어울리는 것을 좋아해서, 친구들의 관심을 끌고 동의를 잘 얻어내는 편이에요.",
  },
  LSH: {
    category: "단호한 개인주의자형",
    ment: "독립적이고 자기 주장이 분명하며 필요할 때는 소통 능력을 발휘하는 유형이에요. 나에게 좋고 싫은 것, 옳고 그르다고 생각하는 것이 분명해요. 하지만 다른 사람의 기분을 상하게 하거나, 친구와 다투지 않고 내 의견을 전달할 줄 알아요. 다정다감하기보다는 단호한 면이 있어요.",
  },
  FTL: {
    category: "좋은데 힘들어형",
    ment: "친구를 좋아하고 잘 맞춰주지만 속으로 힘들어하는 유형이에요. 내 의견을 주장하기보다 친구들의 의견을 따르는 편이에요. 친구 마음을 배려하고 다른 사람과 함께 있는 걸 좋아해요. 하지만 갈등이 생겼을 때 어떻게 해결해야하는지, 내 마음을 어떻게 표현해야하는지 잘 몰라 힘들어할 수 있어요.",
  },
  FSL: {
    category: "조용한 친구형",
    ment: "조용히 혼자 있는 것이 편하고  관계에 어려움을 느끼는 유형이에요. 갈등을 만들기보다는 상황에 따르며 원만히 지내고 싶어해요. 하지만 친구들의 마음을 이해하거나, 지금 어떤 상황이 벌어지고 있는지 빨리 알아차리지 못할 수 있어요. 큰 다툼은 없지만 속으로 친구관계를 힘들어할 수 있어요.",
  },
  LTL: {
    category: "좌충우돌형",
    ment: "친구를 좋아하고 이끌고 싶어하지만 소통 능력이 부족해 어려움을 느끼는 유형이에요. 내 의견을 잘 말하고, 아니라고 생각될 때는 참지 않는 편이에요. 친구들과 어울리는 걸 좋아하고, 다양하게 내 감정을 표현하기도 해요. 하지만 친구들이 내 의견을 잘 따르지 않거나, 종종 갈등이 생겨 힘들어할 수 있어요.",
  },
  LSL: {
    category: "마이웨이형",
    ment: "자기주장이 분명하고 내 영역을 지키고 싶으나 소통이 어려운 유형이에요. 내 생각이 분명하고 그걸 남들에게 잘 표현해요. 하지만 다른 사람의 감정을 이해하는데 서투르고 친구들과 같은 관심사를 공유하기보다 나만의 남다른 취향이 있어요. 갈등이 생겼을 때 어떻게 해결해야하는지 모르고 서로 오해가 깊어질 수 있어요.",
  },
  default: {
    category: "유형검사",
    ment: "미실시",
  },
};
const careerMap = {
  8: {
    careerKey: 8,
    careerId: "firefighter",
    careerName: "소방관",
    careerType: "R",
    imgURL: "/src/Career_IMG/Test/R/firefighter.png",
    // 카드 내용
    careerIntroduce: "소방관은 불을 끄고 위험에 빠져 있는 사람들을 구해줘요",
    carrerAbility: ["신체운동능력", "자기성찰능력"],
    // 모달 내용
    careerContents: `소방관은 화재나 사고를 예방하고 화재나 사고가 발생했을 때 긴급 출동하여 진화 작업을 하며 생명과 재산을 구조하는 역할을 합니다.
    위급한 환자를 구급차로 실어 병원으로 옮기는 활동도 하며 각종 재해가 발생했을 때 피해를 복구하는 역할도 합니다.
    건축물에 있는 소방시설의 안전성을 점검하거나 건물 주변에 위험 요소가 없는지 순찰 활동도 하고 시민들을 대상으로 소방안전과 관련된 교육도 진행합니다.`, // 내부 내용
    carrerAptitudeInterest: `위기 상황에서 재빠르게 대처할 수 있는 순발력과 유연성, 강인한 체력이 있어야 합니다.
    희생정신과 봉사 정신을 가지고 있어야 하며 동료들과 함께 단합할 수 있는 협동심과 리더십도 필요합니다. `,
  },
  9: {
    careerKey: 9,
    careerId: "police_officer",
    careerName: "경찰관",
    careerType: "R",
    imgURL: "/src/Career_IMG/Test/R/police_officer.png",
    careerIntroduce: "경찰관은 범죄를 예방하고 시민의 안전을 지키는 일을 해요",
    carrerAbility: ["신체운동능력", "대인관계능력"],
    careerContents: `경찰관은 범죄를 예방하고 시민의 안전을 지키는 역할을 합니다. 순찰, 사건 조사, 교통 통제 등의 업무를 수행하며, 위급 상황에서 빠르게 대응하여 질서를 유지합니다.
    경찰관은 또한 범죄자 체포 및 수사 업무를 담당하며, 교통사고 예방 및 처리, 시위 관리, 긴급 구조 활동에도 참여합니다. 시민들에게 법률 및 안전 교육을 제공하며, 지역 사회의 안전을 도모하는 중요한 역할을 수행합니다.`,
    carrerAptitudeInterest: `책임감과 사명감을 가지고 있으며 위기 상황에서 침착하고 신속한 판단을 할 수 있는 능력이 필요합니다.
    시민과 원활히 소통할 수 있는 대인관계능력도 요구됩니다. 강한 체력과 정신력이 필요하며, 공정하고 올바른 윤리의식을 갖추어야 합니다.`,
  },
  10: {
    careerKey: 10,
    careerId: "soldier",
    careerName: "직업군인",
    careerType: "R",
    imgURL: "/src/Career_IMG/Test/R/soldier.png",
    careerIntroduce:
      "직업군인은 국가를 방어하고 국민의 안전을 책임지는 일을 해요",
    carrerAbility: ["신체운동능력", "자기성찰능력"],
    careerContents:
      "직업군인은 국가를 방어하고 국민의 안전을 지키는 역할을 합니다. 군사 훈련을 받고, 전투 및 구조 활동을 수행하며, 국가 비상시 대응하는 것이 주요 업무입니다.",
    carrerAptitudeInterest:
      "체력이 우수하고 책임감이 강해야 하며, 협동심과 팀워크를 중요하게 생각하는 자세가 필요합니다.",
  },
  11: {
    careerKey: 11,
    careerId: "athlete",
    careerName: "운동선수",
    careerType: "R",
    imgURL: "/src/Career_IMG/Test/R/athlete.png",
    careerIntroduce:
      "운동선수는 체력을 단련하고 기술을 연마하여 경기에서 최고의 실력을 발휘해요",
    carrerAbility: ["신체운동능력", "자기관리능력"],
    careerContents: `운동선수는 다양한 스포츠 종목에서 경쟁하며, 최고의 기량을 발휘하기 위해 훈련을 지속합니다.
    종목에 따라 육체적 능력, 기술, 전술적 사고가 필요하며, 체력 유지와 부상 예방을 위해 철저한 자기 관리를 합니다.
    프로 스포츠 선수는 대회에 출전하고 기록을 세우는 것이 주된 목표이며, 팀 스포츠 선수는 동료들과 협력하여 경기를 이끌어갑니다.`,
    carrerAptitudeInterest: `강한 체력과 끈기, 도전 정신이 필요하며, 규칙적인 훈련과 엄격한 자기관리가 필수입니다.
    승부욕과 목표 지향적인 태도가 요구되며, 경기 중 압박을 이겨낼 수 있는 정신력과 집중력이 중요합니다.`,
  },
  2: {
    careerKey: 2,
    careerId: "pilot",
    careerName: "항공기 조종사",
    careerType: "R",
    imgURL: "/src/Career_IMG/Test/R/pilot.png",
    careerIntroduce:
      "항공기 조종사는 비행기를 조종하여 승객과 화물을 안전하게 목적지로 운송해요",
    carrerAbility: ["공간지각능력", "수리논리력", "신체운동능력"],
    careerContents: `항공기 조종사는 항공기를 조종하여 승객과 화물을 목적지까지 안전하게 운송하는 역할을 합니다.
    비행 전후 기체 점검, 기상 및 비행 경로 확인, 이착륙 절차 수행 등이 주요 업무이며, 비상 상황 발생 시 신속하고 침착하게 대응해야 합니다.
    민간 항공사 조종사, 군 조종사, 화물기 조종사 등 다양한 분야에서 활동할 수 있습니다.`,
    carrerAptitudeInterest: `높은 집중력과 빠른 판단력이 요구되며, 비행 안전을 위해 철저한 규칙 준수와 절제력이 필요합니다.
    기체 조작을 위한 신체 운동 능력과 공간 지각 능력이 중요하며, 승무원 및 관제사와 원활한 의사소통을 할 수 있는 대인관계 능력도 요구됩니다.`,
  },
  5: {
    careerKey: 5,
    careerId: "chef",
    careerName: "조리사 및 주방장",
    careerType: "R",
    imgURL: "/src/Career_IMG/Test/R/chef.png",
    careerIntroduce: "조리사는 다양한 요리를 만들고 주방을 관리하는 일을 해요",
    carrerAbility: ["손재주", "창의력", "대인관계능력"],
    careerContents: `조리사는 식재료를 활용하여 다양한 요리를 만들고, 음식의 맛과 품질을 유지하는 역할을 합니다.
    메뉴를 개발하고, 위생 및 식재료 관리, 주방 운영을 책임지는 주방장의 역할도 수행할 수 있습니다.
    레스토랑, 호텔, 급식소, 푸드트럭 등 다양한 환경에서 일할 수 있으며, 전문 분야에 따라 한식, 중식, 일식, 양식 조리사로 나뉘기도 합니다.`,
    carrerAptitudeInterest: `음식과 요리에 대한 열정이 필요하며, 창의적인 메뉴를 개발할 수 있는 감각이 요구됩니다.
    손재주와 빠른 작업 속도가 필요하며, 팀워크와 대인관계 능력을 갖추어야 주방에서 원활하게 협력할 수 있습니다.
    위생과 안전 수칙을 철저히 준수하는 책임감도 중요합니다.`,
  },
  12: {
    careerKey: 12,
    careerId: "doctor",
    careerName: "의사",
    careerType: "I",
    imgURL: "/src/Career_IMG/Test/I/doctor.png",
    careerIntroduce: "의사는 환자의 건강을 진단하고 치료하는 일을 해요",
    carrerAbility: ["수리논리력", "문제해결능력", "대인관계능력"],
    careerContents: `의사는 환자의 건강 상태를 진단하고 적절한 치료 방법을 제공하는 역할을 합니다.
    진찰을 통해 질병을 파악하고, 치료 계획을 세우며, 수술이나 약물 처방 등의 치료를 수행합니다.
    내과, 외과, 소아과, 정신과 등 다양한 전문 분야로 세분화되며, 환자의 건강을 위해 지속적인 연구와 학습이 요구됩니다.`,
    carrerAptitudeInterest: `정확한 진단과 치료를 위한 논리적 사고력과 분석력이 필요하며, 환자를 배려하고 공감하는 능력이 중요합니다.
    신속하고 올바른 결정을 내릴 수 있는 문제 해결 능력이 요구되며, 책임감과 끈기가 필수적입니다.
    의료 기술과 지식을 꾸준히 습득하며 발전시켜야 하므로 학습 의지가 강해야 합니다.`,
  },
  13: {
    careerKey: 13,
    careerId: "veterinarian",
    careerName: "수의사",
    careerType: "I",
    imgURL: "/src/Career_IMG/Test/I/veterinarian.png",
    careerIntroduce: "수의사는 동물의 건강을 진단하고 치료하는 일을 해요",
    carrerAbility: ["문제해결능력", "대인관계능력", "자연친화력"],
    careerContents: `수의사는 반려동물, 가축, 야생동물 등의 질병을 진단하고 치료하는 역할을 합니다.
    예방접종, 수술, 건강 상담 등을 수행하며, 동물의 건강을 유지하고 보호하는 것이 주요 업무입니다.
    반려동물 병원, 농장, 동물원, 연구소 등 다양한 환경에서 활동할 수 있으며, 식품 위생 및 동물 전염병 예방과 같은 공공 분야에서도 일할 수 있습니다.`,
    carrerAptitudeInterest: `동물을 사랑하고 배려하는 마음이 필수적이며, 동물의 행동을 관찰하고 문제를 해결할 수 있는 분석력이 요구됩니다.
    환자(동물)와 보호자(사람) 모두를 상대해야 하므로 원활한 대인관계 능력과 의사소통 능력이 중요합니다.
    감염 예방 및 위생 관리에 철저해야 하며, 다양한 동물을 다룰 수 있는 용기와 인내심도 필요합니다.`,
  },
  14: {
    careerKey: 14,
    careerId: "computer_programmer",
    careerName: "컴퓨터 프로그래머",
    careerType: "I",
    imgURL: "/src/Career_IMG/Test/I/computer_programmer.png",
    careerIntroduce:
      "컴퓨터 프로그래머는 소프트웨어를 개발하고 유지보수하는 일을 해요",
    carrerAbility: ["논리적 사고력", "문제해결능력", "수리논리력"],
    careerContents: `컴퓨터 프로그래머는 다양한 프로그래밍 언어를 사용하여 소프트웨어, 애플리케이션, 웹사이트, 시스템을 개발하는 역할을 합니다.
    사용자의 요구를 분석하여 프로그램을 설계하고, 코드를 작성하며, 오류를 수정하고 성능을 최적화합니다.
    IT 기업, 스타트업, 금융, 의료, 게임 산업 등 다양한 분야에서 활동할 수 있으며, 백엔드, 프론트엔드, 풀스택 개발 등 여러 전문 분야로 나뉩니다.`,
    carrerAptitudeInterest: `논리적 사고력과 문제 해결 능력이 필수적이며, 새로운 기술을 배우고 적용하는 학습 능력이 요구됩니다.
    꼼꼼함과 인내심이 필요하며, 팀과 협업하여 프로젝트를 진행할 수 있는 대인관계 능력도 중요합니다.
    효율적인 코드 작성과 소프트웨어 최적화를 위해 창의력과 분석력이 필요합니다.`,
  },
  15: {
    careerKey: 15,
    careerId: "automotive_engineer",
    careerName: "자동차공학기술자",
    careerType: "I",
    imgURL: "/src/Career_IMG/Test/I/automotive_engineer.png",
    careerIntroduce:
      "자동차공학기술자는 자동차를 설계하고 성능을 개선하는 일을 해요",
    carrerAbility: ["수리논리력", "문제해결능력", "공간지각능력"],
    careerContents: `자동차공학기술자는 자동차의 엔진, 섀시, 전기 시스템, 안전 장치 등을 설계하고 성능을 개선하는 역할을 합니다.
    새로운 자동차 모델을 개발하거나 기존 차량을 개선하며, 연비 향상, 친환경 기술, 자율 주행 시스템 등의 연구도 수행합니다.
    자동차 제조업체, 연구소, 부품 개발 회사 등에서 근무할 수 있으며, 기계공학, 전자공학, 소프트웨어 개발 등의 다양한 기술이 융합되는 분야입니다.`,
    carrerAptitudeInterest: `자동차와 기계에 대한 관심과 호기심이 필요하며, 논리적 사고력과 문제 해결 능력이 필수적입니다.
    복잡한 기계 시스템을 이해하고 설계할 수 있는 공간 지각 능력이 요구되며, 실험과 테스트를 통해 데이터를 분석하는 능력도 중요합니다.
    협업이 필수적인 분야이므로 팀워크와 의사소통 능력도 필요합니다.`,
  },
  16: {
    careerKey: 16,
    careerId: "robotics_engineer",
    careerName: "로봇공학기술자",
    careerType: "I",
    imgURL: "/src/Career_IMG/Test/I/robotics_engineer.png",
    careerIntroduce:
      "로봇공학기술자는 로봇을 설계하고 개발하여 다양한 분야에 활용하는 일을 해요",
    carrerAbility: ["수리논리력", "문제해결능력", "공간지각능력"],
    careerContents: `로봇공학기술자는 기계공학, 전자공학, 컴퓨터 공학을 융합하여 로봇을 설계하고 제작하는 역할을 합니다.
    산업용 로봇, 의료 로봇, 자율주행 로봇, 인공지능(AI) 로봇 등 다양한 로봇 시스템을 개발하며, 로봇의 동작을 프로그래밍하고 최적화합니다.
    제조업, 의료, 군사, 우주 탐사, 서비스 산업 등 다양한 분야에서 활용될 로봇을 연구하고 개선합니다.`,
    carrerAptitudeInterest: `기계, 전자, 소프트웨어 등 다양한 기술에 관심이 많아야 하며, 논리적 사고력과 문제 해결 능력이 필수적입니다.
    창의적인 아이디어를 실현할 수 있는 기술적 이해와 실험 정신이 필요하며, 정밀한 설계를 위한 공간 지각 능력이 요구됩니다.
    협업을 통한 연구와 개발이 많으므로 팀워크와 의사소통 능력도 중요합니다.`,
  },
  22: {
    careerKey: 22,
    careerId: "singer",
    careerName: "가수",
    careerType: "A",
    imgURL: "/src/Career_IMG/Test/A/singer.png",
    careerIntroduce:
      "가수는 노래를 부르고 공연을 통해 대중에게 감동을 전달하는 일을 해요",
    carrerAbility: ["음악능력", "창의력", "대중소통능력"],
    careerContents: `가수는 다양한 장르의 음악을 부르고 앨범을 제작하여 대중에게 선보이는 역할을 합니다.
    무대에서 라이브 공연을 하거나 음반을 녹음하며, 음악적 스타일을 개발하고 감정을 전달하는 것이 중요합니다.
    솔로 아티스트, 밴드 멤버, 아이돌 그룹, 성악가 등 다양한 형태로 활동할 수 있으며, 방송, 공연, 온라인 플랫폼을 통해 팬들과 소통합니다.`,
    carrerAptitudeInterest: `음악과 노래에 대한 깊은 애정과 열정이 필요하며, 감정을 표현하는 능력이 중요합니다.
    꾸준한 연습과 자기 계발이 필수이며, 무대 위에서 관객과 교감할 수 있는 대중 소통 능력이 요구됩니다.
    창의력을 바탕으로 자신만의 음악 스타일을 개발할 수 있어야 하며, 인내심과 끈기가 필요합니다.`,
  },
  23: {
    careerKey: 23,
    careerId: "actor",
    careerName: "연기자",
    careerType: "A",
    imgURL: "/src/Career_IMG/Test/A/actor.png",
    careerIntroduce:
      "연기자는 영화, 드라마, 연극 등에서 다양한 캐릭터를 연기하는 일을 해요",
    carrerAbility: ["창의력", "언어능력", "대중소통능력"],
    careerContents: `연기자는 영화, 드라마, 연극, 광고 등에서 캐릭터를 연기하며, 감정을 표현하고 이야기를 전달하는 역할을 합니다.
    대본을 분석하여 캐릭터의 감정을 연구하고, 연기력을 향상시키기 위해 끊임없이 연습합니다.
    다양한 장르와 스타일에서 활동할 수 있으며, 촬영 현장에서 감독, 스태프, 배우들과 협력하여 작품을 만들어 갑니다.`,
    carrerAptitudeInterest: `다양한 감정을 표현할 수 있는 창의력과 집중력이 필요하며, 상황에 몰입하는 능력이 중요합니다.
    언어와 신체 표현 능력이 필수적이며, 대중과 소통하는 능력도 중요합니다.
    인내심과 끈기를 가지고 꾸준히 연습하며, 자신만의 연기 스타일을 개발해야 합니다.`,
  },
  24: {
    careerKey: 24,
    careerId: "dancer",
    careerName: "무용가",
    careerType: "A",
    imgURL: "/src/Career_IMG/Test/A/dancer.png",
    careerIntroduce:
      "무용가는 음악과 리듬에 맞춰 아름다운 동작을 표현하는 일을 해요",
    carrerAbility: ["신체운동능력", "창의력", "음악능력"],
    careerContents: `무용가는 클래식 발레, 현대무용, 한국무용, 힙합, 스트릿 댄스 등 다양한 장르에서 춤을 추고 공연하는 역할을 합니다.
    공연, 뮤직비디오, 무대연출 등에서 활동하며, 감정과 스토리를 몸짓으로 표현하는 것이 중요합니다.
    새로운 안무를 창작하거나 기존 안무를 연습하여 완벽한 공연을 만들며, 체력과 유연성을 유지하기 위해 지속적인 훈련이 필요합니다.`,
    carrerAptitudeInterest: `신체를 자유롭게 움직일 수 있는 유연성과 근력이 필요하며, 음악과 리듬 감각이 뛰어나야 합니다.
    창의적인 표현력을 갖춰야 하며, 감정을 몸으로 전달하는 능력이 중요합니다.
    반복되는 연습과 공연을 견딜 수 있는 체력과 인내심이 필수적입니다.`,
  },
  25: {
    careerKey: 25,
    careerId: "painter",
    careerName: "화가",
    careerType: "A",
    imgURL: "/src/Career_IMG/Test/A/painter.png",
    careerIntroduce:
      "화가는 그림을 그려 감정을 표현하고 예술 작품을 창작하는 일을 해요",
    carrerAbility: ["창의력", "공간지각능력", "손재주"],
    careerContents: `화가는 다양한 재료와 기법을 사용하여 그림을 그리고 예술적 메시지를 전달하는 역할을 합니다.
    유화, 수채화, 판화, 디지털 아트 등 다양한 기법을 활용하며, 개인 작품 활동뿐만 아니라 전시, 일러스트 작업 등 여러 분야에서 활동할 수 있습니다.`,
    carrerAptitudeInterest: `시각적 감각과 창의력이 필수적이며, 색채와 구도를 다룰 줄 알아야 합니다.
    인내심과 끈기가 필요하며, 자기만의 예술적 스타일을 개발할 수 있는 탐구 정신이 요구됩니다.`,
  },
  26: {
    careerKey: 26,
    careerId: "cartoonist",
    careerName: "만화가",
    careerType: "A",
    imgURL: "/src/Career_IMG/Test/A/cartoonist.png",
    careerIntroduce:
      "만화가는 스토리와 그림을 결합하여 만화 작품을 창작하는 일을 해요",
    carrerAbility: ["창의력", "손재주", "언어능력"],
    careerContents: `만화가는 캐릭터와 배경을 그리고 스토리를 구성하여 만화 작품을 제작하는 역할을 합니다.
    웹툰, 애니메이션, 그래픽 노블 등 다양한 형식으로 작업하며, 창작과 연출 능력이 중요합니다.`,
    carrerAptitudeInterest: `스토리텔링과 창의적인 아이디어가 필수적이며, 그림 실력과 손재주가 중요합니다.
    꾸준한 연습과 자기만의 스타일을 개발해야 하며, 독창적인 캐릭터와 세계관을 구상할 수 있어야 합니다.`,
  },
  31: {
    careerKey: 31,
    careerId: "makeup_artist",
    careerName: "메이크업 아티스트",
    careerType: "A",
    imgURL: "/src/Career_IMG/Test/A/makeup_artist.png",
    careerIntroduce:
      "메이크업 아티스트는 다양한 메이크업 기술을 활용하여 사람들의 외모를 아름답게 표현하는 일을 해요",
    carrerAbility: ["손재주", "창의력", "대인관계능력"],
    careerContents: `메이크업 아티스트는 사람의 얼굴형과 피부톤을 고려하여 메이크업을 하고 스타일을 연출하는 역할을 합니다.
    방송, 공연, 웨딩, 패션쇼, 특수 분장 등 다양한 분야에서 활동하며, 개성과 트렌드를 반영한 스타일을 창출합니다.`,
    carrerAptitudeInterest: `색감과 미적 감각이 뛰어나야 하며, 손재주와 세밀한 작업 능력이 필요합니다.
    고객과의 소통 능력이 중요하며, 트렌드를 파악하고 새로운 메이크업 스타일을 연구하는 탐구 정신이 요구됩니다.`,
  },
  33: {
    careerKey: 33,
    careerId: "youtuber",
    careerName: "유튜브 크리에이터",
    careerType: "A",
    imgURL: "/src/Career_IMG/Test/A/youtuber.png",
    careerIntroduce:
      "유튜브 크리에이터는 영상 콘텐츠를 제작하고 대중과 소통하는 일을 해요",
    carrerAbility: ["창의력", "언어능력", "기획력"],
    careerContents: `유튜브 크리에이터는 자신의 관심사와 전문성을 바탕으로 영상을 제작하고, 유튜브 플랫폼을 통해 공유하는 역할을 합니다.
    콘텐츠 기획, 촬영, 편집, 마케팅까지 직접 수행하며, 구독자와 소통하면서 브랜드를 구축합니다.`,
    carrerAptitudeInterest: `창의적인 아이디어를 기획하고 실행할 수 있는 능력이 필요하며, 영상 편집 기술과 표현력이 중요합니다.
    대중과 소통하는 능력이 필수적이며, 지속적인 콘텐츠 개발을 위한 끈기와 성실함이 요구됩니다.`,
  },
  34: {
    careerKey: 34,
    careerId: "psychologist",
    careerName: "심리상담사(임상심리사)",
    careerType: "S",
    imgURL: "/src/Career_IMG/Test/S/psychologist.png",
    careerIntroduce:
      "심리상담사는 사람들의 심리적 어려움을 해결하고 정신 건강을 돕는 일을 해요",
    carrerAbility: ["대인관계능력", "언어능력", "자기성찰능력"],
    careerContents: `심리상담사는 개인의 정신 건강을 평가하고 상담을 통해 정서적 문제를 해결하도록 돕는 역할을 합니다.
    임상심리, 상담심리, 학교 상담 등 다양한 분야에서 활동하며, 심리검사, 치료 프로그램 운영, 정신 건강 교육을 수행합니다.`,
    carrerAptitudeInterest: `공감 능력과 타인을 이해하려는 자세가 중요하며, 논리적인 사고력과 문제 해결 능력이 필요합니다.
    심리학적 지식을 지속적으로 습득해야 하며, 사람들과 원활한 소통이 필수적입니다.`,
  },
  36: {
    careerKey: 36,
    careerId: "nurse",
    careerName: "간호사",
    careerType: "S",
    imgURL: "/src/Career_IMG/Test/S/nurse.png",
    careerIntroduce: "간호사는 환자를 돌보고 의료 서비스를 제공하는 일을 해요",
    carrerAbility: ["대인관계능력", "문제해결능력", "신체운동능력"],
    careerContents: `간호사는 병원, 클리닉, 요양 시설 등에서 환자의 건강을 돌보고 치료를 돕는 역할을 합니다.
    의료진과 협력하여 진료를 보조하고, 응급 처치, 투약 관리, 환자 상담 등의 업무를 수행합니다.`,
    carrerAptitudeInterest: `환자를 배려하는 따뜻한 마음이 필요하며, 빠른 판단력과 문제 해결 능력이 중요합니다.
    체력과 인내심이 요구되며, 의료 지식을 지속적으로 습득해야 합니다.`,
  },
  38: {
    careerKey: 38,
    careerId: "kindergarten_teacher",
    careerName: "유치원 교사",
    careerType: "S",
    imgURL: "/src/Career_IMG/Test/S/kindergarten_teacher.png",
    careerIntroduce: "유치원 교사는 어린이들을 교육하고 돌보는 일을 해요",
    carrerAbility: ["대인관계능력", "언어능력", "창의력"],
    careerContents: `유치원 교사는 유아들의 인지, 정서, 사회성 발달을 돕는 교육을 담당하는 역할을 합니다.
    놀이 활동, 기초 학습, 생활 지도 등을 통해 아이들이 건강하고 바르게 성장할 수 있도록 돕습니다.`,
    carrerAptitudeInterest: `아이들을 좋아하고 친절하며, 책임감이 강해야 합니다.
    창의력과 인내심이 필요하며, 원활한 의사소통 능력이 중요합니다.`,
  },
  39: {
    careerKey: 39,
    careerId: "school_teacher",
    careerName: "초중등 교사",
    careerType: "S",
    imgURL: "/src/Career_IMG/Test/S/school_teacher.png",
    careerIntroduce:
      "초중등 교사는 학생들에게 지식을 가르치고 성장할 수 있도록 돕는 일을 해요",
    carrerAbility: ["언어능력", "대인관계능력", "자기성찰능력"],
    careerContents: `초중등 교사는 학생들에게 교과목을 가르치고 학습을 지도하는 역할을 합니다.
    학습 계획을 세우고, 시험을 통해 평가하며, 학생의 생활 지도 및 상담도 수행합니다.`,
    carrerAptitudeInterest: `교육에 대한 열정이 필요하며, 학생을 이해하고 인내심 있게 지도할 수 있어야 합니다.
    전달력이 뛰어나야 하며, 문제 해결 능력과 대인관계 기술이 중요합니다.`,
  },
  40: {
    careerKey: 40,
    careerId: "clergy",
    careerName: "성직자",
    careerType: "S",
    imgURL: "/src/Career_IMG/Test/S/clergy.png",
    careerIntroduce:
      "성직자는 종교적 가르침을 전파하고 신도들을 지도하는 일을 해요",
    carrerAbility: ["대인관계능력", "언어능력", "자기성찰능력"],
    careerContents: `성직자는 종교적 신념을 바탕으로 신도들에게 가르침을 제공하고 예배, 상담, 봉사 활동을 수행하는 역할을 합니다.
    다양한 종교 기관에서 활동하며, 신앙 상담, 설교, 공동체 운영 등을 담당합니다.`,
    carrerAptitudeInterest: `신앙심과 도덕적 가치관이 중요하며, 사람들과 소통하는 능력이 필요합니다.
    신도들에게 긍정적인 영향을 줄 수 있는 인내심과 공감 능력이 요구됩니다.`,
  },
  47: {
    careerKey: 47,
    careerId: "lawyer",
    careerName: "변호사",
    careerType: "E",
    imgURL: "/src/Career_IMG/Test/E/lawyer.png",
    careerIntroduce:
      "변호사는 법률 지식을 바탕으로 사람들의 권리를 보호하고 법적 문제를 해결하는 일을 해요",
    carrerAbility: ["논리적 사고력", "언어능력", "문제해결능력"],
    careerContents: `변호사는 법률 상담, 소송 대리, 법률 문서 작성 등을 통해 의뢰인의 법적 문제를 해결하는 역할을 합니다.
    민사, 형사, 기업 법무, 국제법 등 다양한 분야에서 활동하며, 법률 해석과 논리를 바탕으로 사건을 해결합니다.`,
    carrerAptitudeInterest: `법을 정확하게 이해하고 해석할 수 있는 논리적 사고력이 필요하며, 분석력과 문제 해결 능력이 중요합니다.
    의뢰인과 원활하게 소통할 수 있는 언어 능력이 요구되며, 윤리의식과 책임감이 필수적입니다.`,
  },
  48: {
    careerKey: 48,
    careerId: "diplomat",
    careerName: "외교관",
    careerType: "E",
    imgURL: "/src/Career_IMG/Test/E/diplomat.png",
    careerIntroduce:
      "외교관은 국가를 대표하여 국제 관계를 조정하고 외교 업무를 수행하는 일을 해요",
    carrerAbility: ["언어능력", "대인관계능력", "문제해결능력"],
    careerContents: `외교관은 다른 국가와의 외교 협상을 수행하고, 국제 회의 및 조약 체결에 참여하는 역할을 합니다.
    해외 대사관, 영사관 등에서 활동하며, 국가의 이익을 보호하고 국제 협력을 촉진하는 업무를 담당합니다.`,
    carrerAptitudeInterest: `국제 정세에 대한 이해가 필요하며, 외국어 능력과 소통 능력이 중요합니다.
    논리적인 사고력과 문제 해결 능력이 필수적이며, 공적인 업무를 수행할 책임감이 요구됩니다.`,
  },
  49: {
    careerKey: 49,
    careerId: "congressman",
    careerName: "국회의원",
    careerType: "E",
    imgURL: "/src/Career_IMG/Test/E/congressman.png",
    careerIntroduce:
      "국회의원은 국민을 대표하여 법을 제정하고 정책을 결정하는 일을 해요",
    carrerAbility: ["언어능력", "대인관계능력", "정치적 판단력"],
    careerContents: `국회의원은 법률을 제정하고 개정하며, 국가 정책을 결정하는 역할을 합니다.
    국민의 의견을 수렴하고 토론을 통해 정책 방향을 설정하며, 정부 활동을 감시하고 평가하는 업무도 수행합니다.`,
    carrerAptitudeInterest: `사회 문제와 정책에 대한 깊은 관심이 필요하며, 공익을 우선시하는 자세가 중요합니다.
    설득력 있는 언어 능력과 대중과 원활하게 소통할 수 있는 능력이 요구됩니다.`,
  },
  50: {
    careerKey: 50,
    careerId: "journalist",
    careerName: "기자",
    careerType: "E",
    imgURL: "/src/Career_IMG/Test/E/journalist.png",
    careerIntroduce:
      "기자는 사회에서 일어나는 사건을 취재하고 보도하는 일을 해요",
    carrerAbility: ["언어능력", "분석력", "문제해결능력"],
    careerContents: `기자는 신문, 방송, 온라인 매체 등을 통해 뉴스를 취재하고 보도하는 역할을 합니다.
    사건 현장을 취재하고 사실을 분석하며, 독자나 시청자가 신뢰할 수 있는 보도를 제공하는 것이 중요합니다.`,
    carrerAptitudeInterest: `사회 현상에 대한 관심과 분석력이 필요하며, 정보를 정확하게 전달할 수 있는 글쓰기 능력이 중요합니다.
    현장을 빠르게 판단하고 대응하는 순발력과 책임감이 요구됩니다.`,
  },
  51: {
    careerKey: 51,
    careerId: "broadcast_producer",
    careerName: "방송연출가(PD)",
    careerType: "E",
    imgURL: "/src/Career_IMG/Test/E/broadcast_producer.png",
    careerIntroduce:
      "방송연출가는 TV, 라디오, 온라인 플랫폼에서 다양한 콘텐츠를 기획하고 제작하는 일을 해요",
    carrerAbility: ["창의력", "기획력", "대인관계능력"],
    careerContents: `방송연출가는 드라마, 예능, 뉴스, 다큐멘터리 등의 프로그램을 기획하고 제작하는 역할을 합니다.
    프로그램의 콘셉트를 정하고 촬영과 편집을 지휘하며, 시청자들에게 흥미로운 콘텐츠를 제공하는 것이 핵심입니다.`,
    carrerAptitudeInterest: `콘텐츠 제작에 대한 열정과 창의력이 필요하며, 트렌드를 읽고 기획할 수 있는 능력이 중요합니다.
    다양한 스태프 및 출연진과 협업해야 하므로 원활한 의사소통 능력이 요구됩니다.`,
  },
  55: {
    careerKey: 55,
    careerId: "public_official",
    careerName: "공무원",
    careerType: "C",
    imgURL: "/src/Career_IMG/Test/C/public_official.png",
    careerIntroduce:
      "공무원은 국가와 지방자치단체에서 국민을 위한 행정 업무를 수행하는 일을 해요",
    carrerAbility: ["문제해결능력", "대인관계능력", "책임감"],
    careerContents: `공무원은 국민을 위한 행정 서비스를 제공하며, 법률과 정책을 집행하는 역할을 합니다.
    중앙정부 및 지방정부에서 다양한 분야(행정, 복지, 교육, 치안 등)에서 근무할 수 있으며, 시민들의 복지를 향상시키는 것이 주요 업무입니다.`,
    carrerAptitudeInterest: `공익을 위한 봉사 정신이 필요하며, 법과 원칙을 준수하는 책임감이 요구됩니다.
    행정 업무를 수행할 논리적 사고력과 문제 해결 능력이 중요하며, 국민과 소통하는 대인관계 기술이 필요합니다.`,
  },
  56: {
    careerKey: 56,
    careerId: "librarian",
    careerName: "사서",
    careerType: "C",
    imgURL: "/src/Career_IMG/Test/C/librarian.png",
    careerIntroduce:
      "사서는 도서관에서 자료를 관리하고 이용자에게 정보를 제공하는 일을 해요",
    carrerAbility: ["분류능력", "언어능력", "정보처리능력"],
    careerContents: `사서는 도서 및 자료를 체계적으로 분류하고 보관하며, 이용자가 필요한 정보를 효과적으로 찾을 수 있도록 돕는 역할을 합니다.
    공공도서관, 대학도서관, 기업 연구소 등에서 근무하며, 정보검색 및 교육 프로그램 운영도 담당합니다.`,
    carrerAptitudeInterest: `책과 정보에 대한 관심이 필요하며, 데이터를 체계적으로 정리하는 능력이 요구됩니다.
    이용자와 원활하게 소통할 수 있는 언어 능력과 정보 활용 능력이 중요합니다.`,
  },
  60: {
    careerKey: 60,
    careerId: "banker",
    careerName: "은행원",
    careerType: "C",
    imgURL: "/src/Career_IMG/Test/C/banker.png",
    careerIntroduce:
      "은행원은 금융 서비스를 제공하며 고객의 자산을 관리하는 일을 해요",
    carrerAbility: ["수리논리력", "대인관계능력", "책임감"],
    careerContents: `은행원은 고객의 예금, 대출, 송금 업무를 처리하며, 금융 상품을 안내하는 역할을 합니다.
    기업 및 개인 고객과 상담하며, 금융 시장의 변화를 분석하고 투자 상담을 제공하기도 합니다.`,
    carrerAptitudeInterest: `정확한 계산과 분석 능력이 필요하며, 고객과 신뢰를 쌓을 수 있는 대인관계 능력이 중요합니다.
    금융 관련 지식을 지속적으로 습득하고, 책임감과 윤리 의식을 갖춰야 합니다.`,
  },
  62: {
    careerKey: 62,
    careerId: "air_traffic_controller",
    careerName: "항공교통관제사",
    careerType: "C",
    imgURL: "/src/Career_IMG/Test/C/air_traffic_controller.png",
    careerIntroduce:
      "항공교통관제사는 항공기의 안전한 이착륙과 비행을 돕는 일을 해요",
    carrerAbility: ["공간지각능력", "수리논리력", "신속한 판단력"],
    careerContents: `항공교통관제사는 레이더와 무전 시스템을 이용하여 항공기의 이동을 지시하고 안전한 운항을 지원하는 역할을 합니다.
    비행 계획을 관리하며, 기상 변화 및 돌발 상황에 신속하게 대처해야 합니다.`,
    carrerAptitudeInterest: `높은 집중력과 신속한 판단력이 필요하며, 항공기의 위치를 정확하게 파악할 공간 지각 능력이 요구됩니다.
    스트레스 상황에서도 침착함을 유지할 수 있어야 하며, 명확한 의사소통 능력이 중요합니다.`,
  },
  63: {
    careerKey: 63,
    careerId: "security_specialist",
    careerName: "정보보안전문가",
    careerType: "C",
    imgURL: "/src/Career_IMG/Test/C/security_specialist.png",
    careerIntroduce:
      "정보보안전문가는 해킹과 사이버 위협으로부터 데이터를 보호하는 일을 해요",
    carrerAbility: ["수리논리력", "문제해결능력", "분석력"],
    careerContents: `정보보안전문가는 네트워크와 시스템의 보안 취약점을 분석하고 해킹 및 사이버 공격을 예방하는 역할을 합니다.
    기업, 정부 기관, 금융권 등 다양한 분야에서 정보 보호 및 보안 정책을 설계하고 운영합니다.`,
    carrerAptitudeInterest: `논리적 사고력과 문제 해결 능력이 필수적이며, 지속적으로 변화하는 보안 기술을 학습해야 합니다.
    침착하고 분석적인 성향이 요구되며, 사이버 보안 위험을 예방하고 대응할 수 있는 실무 능력이 중요합니다.`,
  },
};
const carrerTypeMap = {
  A: {
    mainContent: "예술형",
    subContent: "예술적인 것을 사랑하는",
    esContent: "Artistic Type",
  },
  C: {
    mainContent: "관습형",
    subContent: "체계적이고 꼼꼼한",
    esContent: "Conventional Type",
  },
  E: {
    mainContent: "진취형",
    subContent: "리더가 되기를 원하는",
    esContent: "Enterprising Type",
  },
  I: {
    mainContent: "탐구형",
    subContent: "배움에 대한 열정이 있는",
    esContent: "Investigative Type",
  },
  R: {
    mainContent: "실재형",
    subContent: "현실적인 것에 관심이 있는",
    esContent: "Realistic Type",
  },
  S: {
    mainContent: "사회형",
    subContent: "사람을 좋아하는",
    esContent: "Social Type",
  },
};

module.exports = {
  ebtResultMap,
  ptResultMap,
  friendMap,
  careerMap,
  carrerTypeMap,
};
