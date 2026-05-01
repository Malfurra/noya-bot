const mongoose = require('mongoose');
const config = require('./config');

const schema = new mongoose.Schema({
    _id: String,
    data: mongoose.Schema.Types.Mixed
}, { strict: false });

const Model = mongoose.model('BotData', schema);

const dbs = {
    authorizedUsers: [],
    ownerUsers: [],
    contactDb: {},
    listDb: {},
    schedDb: {},
    settingsDb: {},
    warnDb: {},
    groupDb: {},
    blockDb: [],
    usersDb: {},
    noyaBrainDb: {},
    noyaHistoryDb: {},
    userFactsDb: {},
    afkDb: {},
    gameDb: {},
    ecoDb: {},       
    tttStatDb: {},
    bannedCmdsDb: {} 
};

async function connectDb() {
    await mongoose.connect(config.mongoUrl);
    const docs = await Model.find({});
    const dbMap = {};
    docs.forEach(doc => dbMap[doc._id] = doc.data);

    dbs.authorizedUsers  = [...new Set([...(dbMap['authorizedUsers'] || []), ...config.ownerNumbers])];
    dbs.ownerUsers       = [...new Set([...(dbMap['ownerUsers'] || []), ...config.ownerNumbers])];
    dbs.contactDb        = dbMap['contactDb']  || {};
    dbs.listDb           = dbMap['listDb']     || {};
    dbs.schedDb          = dbMap['schedDb']    || {
        pagi:  { texts: config.templatePagi,  target: null, enabled: false },
        malam: { texts: config.templateMalam, target: null, enabled: false }
    };
    dbs.settingsDb  = dbMap['settingsDb']  || { prefix: global.prefa?.[0] || '.' };
    dbs.warnDb      = dbMap['warnDb']      || {};
    dbs.groupDb     = dbMap['groupDb']     || {};
    dbs.blockDb     = dbMap['blockDb']     || [];
    dbs.usersDb     = dbMap['usersDb']     || {};
    dbs.noyaBrainDb = dbMap['noyaBrainDb'] || {};
    dbs.noyaHistoryDb = dbMap['noyaHistoryDb'] || {};
    dbs.userFactsDb = dbMap['userFactsDb'] || {};
    dbs.afkDb       = dbMap['afkDb']       || {};
    dbs.gameDb      = dbMap['gameDb']      || {};
    dbs.ecoDb       = dbMap['ecoDb']       || {};       
    dbs.tttStatDb   = dbMap['tttStatDb']   || {};
    dbs.bannedCmdsDb = dbMap['bannedCmdsDb'] || {};
}

async function saveDb(key) {
    await Model.updateOne({ _id: key }, { data: dbs[key] }, { upsert: true });
}

module.exports = { connectDb, dbs, saveDb };