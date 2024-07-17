const { ebt_Result, ebt_Consulting, ebt_Solution } = require("../DB/psy_test");

// SoyesAI Database Table Info
const User_Table_Info = {
  table: "soyes_ai_User",
  attribute: {
    pKey: "uid",
    attr1: "Email",
    attr2: "passWard",
    attr3: "name",
    attr4: "phoneNumber",
    attr5: "oauth_type",
    attr6: "creation_date",
    attr7: "lastLogin_date",
  },
};
const Plan_Table_Info = {
  Plan: {
    table: "soyes_ai_User_Plan",
    attribute: {
      pKey: "uid",
      attr1: "expirationDate",
      attr2: "plan_status",
    },
  },
  Info: {
    table: "soyes_ai_Plan_Info",
    attribute: {
      pKey: "plan_id",
      attr1: "plan_name",
      attr2: "plan_period",
      attr3: "plan_price",
    },
  },
  Log: {
    table: "soyes_ai_Plan_Log",
    attribute: {
      cKey: "uid",
      attr1: "plan_id",
      attr2: "pay_type",
      attr3: "pay_number",
      attr4: "pay_amount",
      attr5: "pay_tax_free_amount",
    },
  },
};
const EBT_Table_Info = {
  School: {
    ebtClass: "School",
    table: "soyes_ai_Ebt_School",
    attribute: {
      pKey: "uid",
      attr1: "school_question_0",
      attr2: "school_question_1",
      attr3: "school_question_2",
      attr4: "school_question_3",
      attr5: "school_question_4",
      attr6: "school_question_5",
      attr7: "chat",
      attr8: "date",
    },
    result: ebt_Result["School"], // 적용 프롬프트
    consult: ebt_Consulting["School"], // 적용 프롬프트
    solution: ebt_Solution["School"], // 적용 프롬프트
    danger_score: 7.6,
    caution_score: 6.5,
    average: 3.053449951,
    standard: 2.268902495,
  },
  Friend: {
    ebtClass: "Friend",
    table: "soyes_ai_Ebt_Friend",
    attribute: {
      pKey: "uid",
      attr1: "friend_question_0",
      attr2: "friend_question_1",
      attr3: "friend_question_2",
      attr4: "friend_question_3",
      attr5: "friend_question_4",
      attr6: "friend_question_5",
      attr7: "friend_question_6",
      attr8: "friend_question_7",
      attr9: "chat",
      attr10: "date",
    },
    result: ebt_Result["Friend"], // 적용 프롬프트
    consult: ebt_Consulting["Friend"], // 적용 프롬프트
    solution: ebt_Solution["Friend"], // 적용 프롬프트
    danger_score: 9.6,
    caution_score: 8.2,
    average: 4.1379981,
    standard: 2.718721,
  },
  Family: {
    ebtClass: "Family",
    table: "soyes_ai_Ebt_Family",
    attribute: {
      pKey: "uid",
      attr1: "family_question_0",
      attr2: "family_question_1",
      attr3: "family_question_2",
      attr4: "family_question_3",
      attr5: "family_question_4",
      attr6: "family_question_5",
      attr7: "family_question_6",
      attr8: "chat",
      attr9: "date",
    },
    result: ebt_Result["Family"], // 적용 프롬프트
    consult: ebt_Consulting["Family"], // 적용 프롬프트
    solution: ebt_Solution["Family"], // 적용 프롬프트
    danger_score: 8,
    caution_score: 7,
    average: 3,
    standard: 3,
  },
  Mood: {
    ebtClass: "Mood",
    table: "soyes_ai_Ebt_Mood",
    attribute: {
      pKey: "uid",
      attr1: "mood_question_0",
      attr2: "mood_question_1",
      attr3: "mood_question_2",
      attr4: "chat",
      attr5: "date",
    },
    result: ebt_Result["Mood"], // 적용 프롬프트
    consult: ebt_Consulting["Mood"], // 적용 프롬프트
    solution: ebt_Solution["Mood"], // 적용 프롬프트
    danger_score: 5,
    caution_score: 4,
    average: 2,
    standard: 1,
  },
  Unrest: {
    ebtClass: "Unrest",
    table: "soyes_ai_Ebt_Unrest",
    attribute: {
      pKey: "uid",
      attr1: "unrest_question_0",
      attr2: "unrest_question_1",
      attr3: "unrest_question_2",
      attr4: "unrest_question_3",
      attr5: "unrest_question_4",
      attr6: "unrest_question_5",
      attr7: "chat",
      attr8: "date",
    },
    result: ebt_Result["Unrest"], // 적용 프롬프트
    danger_score: 10,
    caution_score: 9,
    average: 5,
    standard: 3,
  },
  Sad: {
    ebtClass: "Sad",
    table: "soyes_ai_Ebt_Sad",
    attribute: {
      pKey: "uid",
      attr1: "sad_question_0",
      attr2: "sad_question_1",
      attr3: "sad_question_2",
      attr4: "sad_question_3",
      attr5: "sad_question_4",
      attr6: "sad_question_5",
      attr7: "sad_question_6",
      attr8: "chat",
      attr9: "date",
    },
    result: ebt_Result["Sad"], // 적용 프롬프트
    danger_score: 10,
    caution_score: 9,
    average: 5,
    standard: 3,
  },
  Health: {
    ebtClass: "Health",
    table: "soyes_ai_Ebt_Health",
    attribute: {
      pKey: "uid",
      attr1: "health_question_0",
      attr2: "health_question_1",
      attr3: "health_question_2",
      attr4: "health_question_3",
      attr5: "health_question_4",
      attr6: "chat",
      attr7: "date",
    },
    result: ebt_Result["Health"], // 적용 프롬프트
    consult: ebt_Consulting["Health"], // 적용 프롬프트
    solution: ebt_Solution["Health"], // 적용 프롬프트
    danger_score: 7,
    caution_score: 6,
    average: 3,
    standard: 2,
  },
  Attention: {
    ebtClass: "Attention",
    table: "soyes_ai_Ebt_Attention",
    attribute: {
      pKey: "uid",
      attr1: "attention_question_0",
      attr2: "attention_question_1",
      attr3: "attention_question_2",
      attr4: "attention_question_3",
      attr5: "attention_question_4",
      attr6: "attention_question_5",
      attr7: "attention_question_6",
      attr8: "chat",
      attr9: "date",
    },
    result: ebt_Result["Attention"], // 적용 프롬프트
    danger_score: 11,
    caution_score: 9,
    average: 5,
    standard: 3,
  },
  Movement: {
    ebtClass: "Movement",
    table: "soyes_ai_Ebt_Movement",
    attribute: {
      pKey: "uid",
      attr1: "movement_question_0",
      attr2: "movement_question_1",
      attr3: "movement_question_2",
      attr4: "movement_question_3",
      attr5: "movement_question_4",
      attr6: "movement_question_5",
      attr7: "movement_question_6",
      attr8: "chat",
      attr9: "date",
    },
    result: ebt_Result["Movement"], // 적용 프롬프트
    danger_score: 8,
    caution_score: 7,
    average: 3,
    standard: 2,
  },
  Angry: {
    ebtClass: "Angry",
    table: "soyes_ai_Ebt_Angry",
    attribute: {
      pKey: "uid",
      attr1: "angry_question_0",
      attr2: "angry_question_1",
      attr3: "angry_question_2",
      attr4: "angry_question_3",
      attr5: "angry_question_4",
      attr6: "angry_question_5",
      attr7: "chat",
      attr8: "date",
    },
    result: ebt_Result["Angry"], // 적용 프롬프트
    danger_score: 8,
    caution_score: 7,
    average: 3,
    standard: 2,
  },
  Self: {
    ebtClass: "Self",
    table: "soyes_ai_Ebt_Self",
    attribute: {
      pKey: "uid",
      attr1: "self_question_0",
      attr2: "self_question_1",
      attr3: "self_question_2",
      attr4: "self_question_3",
      attr5: "self_question_4",
      attr6: "chat",
      attr7: "date",
    },
    result: ebt_Result["Self"], // 적용 프롬프트
    consult: ebt_Consulting["Self"], // 적용 프롬프트
    solution: ebt_Solution["Self"], // 적용 프롬프트
    danger_score: 7.1,
    caution_score: 5.9,
    average: 2.54907677,
    standard: 2.2565882,
  },
  Log: {
    table: "soyes_ai_User_Ebt_Log",
    attribute: {
      cKey: "uid",
      attr1: "date",
      attr2: "ebt_analysis",
      attr3: "ebt_type",
      attr4: "ebt_tScore",
    },
  },
};
const PT_Table_Info = {
  Main: {
    table: "soyes_ai_PT",
    attribute: {
      pKey: "uid",
      attr1: "date",
      attr2: "persanl_result",
      attr3: "chat",
    },
  },

  Log: {
    table: "soyes_ai_User_Pt_Log",
    attribute: {
      cKey: "uid",
      attr1: "date",
      attr2: "persanl_result",
      attr3: "pt_analysis",
    },
  },
};
const Consult_Table_Info = {
  Analysis: {
    table: "soyes_ai_User_Consult_Analysis",
    attribute: {
      pKey: "uid",
      attr1: "ella_psycho_analysis",
      attr2: "ubi_psycho_analysis",
    },
  },
  Log: {
    table: "soyes_ai_User_Consult_Log",
    attribute: {
      pKey: "uid",
      attr1: "avarta_name",
      attr2: "consult_log",
    },
  },
};
const Review_Table_Info = {
  table: "soyes_ai_User_Review_Log",
  attribute: {
    cKey: "uid",
    attr1: "profile_img_url",
    attr2: "content",
  },
};
const Ella_Training_Table_Info = {
  Mood: {
    table: "soyes_training_mood",
    attribute: {
      pKey: "mood_idx",
      fKey: "uid",
      attr1: "mood_round_idx",
      attr2: "mood_name",
      attr3: "mood_score",
      attr4: "mood_todo_list",
      attr5: "mood_talk_list",
      attr6: "mood_avartar",
      attr7: "created_at",
      attr8: "updated_at",
    },
  },
};
module.exports = {
  User_Table_Info,
  Plan_Table_Info,
  EBT_Table_Info,
  PT_Table_Info,
  Consult_Table_Info,
  Review_Table_Info,
  Ella_Training_Table_Info,
};
