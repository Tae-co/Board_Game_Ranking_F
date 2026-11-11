import koCommon from './ko/common';
import koLogin from './ko/login';
import koLobby from './ko/lobby';
import koInvite from './ko/invite';
import koGameSelect from './ko/gameSelect';
import koScoreSheet from './ko/scoreSheet';
import koRanking from './ko/ranking';
import koProfile from './ko/profile';
import koCommunity from './ko/community';
import koAdmin from './ko/admin';
import koSeason from './ko/season';
import koStore from './ko/store';
import koContest from './ko/contest';
import koErrors from './ko/errors';

import enCommon from './en/common';
import enLogin from './en/login';
import enLobby from './en/lobby';
import enInvite from './en/invite';
import enGameSelect from './en/gameSelect';
import enScoreSheet from './en/scoreSheet';
import enRanking from './en/ranking';
import enProfile from './en/profile';
import enCommunity from './en/community';
import enAdmin from './en/admin';
import enSeason from './en/season';
import enStore from './en/store';
import enContest from './en/contest';
import enErrors from './en/errors';

const translations = {
  ko: {
    common: koCommon,
    login: koLogin,
    lobby: koLobby,
    invite: koInvite,
    gameSelect: koGameSelect,
    scoreSheet: koScoreSheet,
    ranking: koRanking,
    profile: koProfile,
    community: koCommunity,
    admin: koAdmin,
    season: koSeason,
    store: koStore,
    contest: koContest,
    errors: koErrors,
  },
  en: {
    common: enCommon,
    login: enLogin,
    lobby: enLobby,
    invite: enInvite,
    gameSelect: enGameSelect,
    scoreSheet: enScoreSheet,
    ranking: enRanking,
    profile: enProfile,
    community: enCommunity,
    admin: enAdmin,
    season: enSeason,
    store: enStore,
    contest: enContest,
    errors: enErrors,
  },
};

export default translations;
