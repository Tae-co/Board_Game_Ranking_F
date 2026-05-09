import koCommon from './ko/common';
import koLogin from './ko/login';
import koLobby from './ko/lobby';
import koInvite from './ko/invite';
import koGameSelect from './ko/gameSelect';
import koMatchForm from './ko/matchForm';
import koScoreSheet from './ko/scoreSheet';
import koRanking from './ko/ranking';
import koProfile from './ko/profile';
import koCommunity from './ko/community';
import koAdmin from './ko/admin';

import enCommon from './en/common';
import enLogin from './en/login';
import enLobby from './en/lobby';
import enInvite from './en/invite';
import enGameSelect from './en/gameSelect';
import enMatchForm from './en/matchForm';
import enScoreSheet from './en/scoreSheet';
import enRanking from './en/ranking';
import enProfile from './en/profile';
import enCommunity from './en/community';
import enAdmin from './en/admin';

const translations = {
  ko: {
    common: koCommon,
    login: koLogin,
    lobby: koLobby,
    invite: koInvite,
    gameSelect: koGameSelect,
    matchForm: koMatchForm,
    scoreSheet: koScoreSheet,
    ranking: koRanking,
    profile: koProfile,
    community: koCommunity,
    admin: koAdmin,
  },
  en: {
    common: enCommon,
    login: enLogin,
    lobby: enLobby,
    invite: enInvite,
    gameSelect: enGameSelect,
    matchForm: enMatchForm,
    scoreSheet: enScoreSheet,
    ranking: enRanking,
    profile: enProfile,
    community: enCommunity,
    admin: enAdmin,
  },
};

export default translations;
