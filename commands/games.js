const { saveDb } = require('../database');
const { resolveUser, awardXp } = require('../utils/helpers');

const FLAGS = [
    { image: 'https://flagcdn.com/w320/id.png', answer: ['indonesia'], hint: 'Asia Tenggara' },
    { image: 'https://flagcdn.com/w320/my.png', answer: ['malaysia'], hint: 'Asia Tenggara' },
    { image: 'https://flagcdn.com/w320/sg.png', answer: ['singapura', 'singapore'], hint: 'Asia Tenggara' },
    { image: 'https://flagcdn.com/w320/th.png', answer: ['thailand'], hint: 'Asia Tenggara' },
    { image: 'https://flagcdn.com/w320/ph.png', answer: ['filipina', 'philippines'], hint: 'Asia Tenggara' },
    { image: 'https://flagcdn.com/w320/vn.png', answer: ['vietnam'], hint: 'Asia Tenggara' },
    { image: 'https://flagcdn.com/w320/mm.png', answer: ['myanmar', 'burma'], hint: 'Asia Tenggara' },
    { image: 'https://flagcdn.com/w320/kh.png', answer: ['kamboja', 'cambodia'], hint: 'Asia Tenggara' },
    { image: 'https://flagcdn.com/w320/la.png', answer: ['laos'], hint: 'Asia Tenggara' },
    { image: 'https://flagcdn.com/w320/bn.png', answer: ['brunei'], hint: 'Asia Tenggara' },
    { image: 'https://flagcdn.com/w320/tl.png', answer: ['timor leste', 'east timor'], hint: 'Asia Tenggara' },
    { image: 'https://flagcdn.com/w320/jp.png', answer: ['jepang', 'japan'], hint: 'Asia Timur' },
    { image: 'https://flagcdn.com/w320/cn.png', answer: ['cina', 'china', 'tiongkok'], hint: 'Asia Timur' },
    { image: 'https://flagcdn.com/w320/kr.png', answer: ['korea selatan', 'korsel', 'south korea'], hint: 'Asia Timur' },
    { image: 'https://flagcdn.com/w320/kp.png', answer: ['korea utara', 'north korea'], hint: 'Asia Timur' },
    { image: 'https://flagcdn.com/w320/mn.png', answer: ['mongolia'], hint: 'Asia Timur' },
    { image: 'https://flagcdn.com/w320/tw.png', answer: ['taiwan'], hint: 'Asia Timur' },
    { image: 'https://flagcdn.com/w320/in.png', answer: ['india'], hint: 'Asia Selatan' },
    { image: 'https://flagcdn.com/w320/pk.png', answer: ['pakistan'], hint: 'Asia Selatan' },
    { image: 'https://flagcdn.com/w320/bd.png', answer: ['bangladesh'], hint: 'Asia Selatan' },
    { image: 'https://flagcdn.com/w320/lk.png', answer: ['sri lanka'], hint: 'Asia Selatan' },
    { image: 'https://flagcdn.com/w320/np.png', answer: ['nepal'], hint: 'Asia Selatan' },
    { image: 'https://flagcdn.com/w320/bt.png', answer: ['bhutan'], hint: 'Asia Selatan' },
    { image: 'https://flagcdn.com/w320/mv.png', answer: ['maladewa', 'maldives'], hint: 'Asia Selatan' },
    { image: 'https://flagcdn.com/w320/af.png', answer: ['afghanistan'], hint: 'Asia Selatan' },
    { image: 'https://flagcdn.com/w320/kz.png', answer: ['kazakhstan'], hint: 'Asia Tengah' },
    { image: 'https://flagcdn.com/w320/uz.png', answer: ['uzbekistan'], hint: 'Asia Tengah' },
    { image: 'https://flagcdn.com/w320/tm.png', answer: ['turkmenistan'], hint: 'Asia Tengah' },
    { image: 'https://flagcdn.com/w320/kg.png', answer: ['kirgistan', 'kyrgyzstan'], hint: 'Asia Tengah' },
    { image: 'https://flagcdn.com/w320/tj.png', answer: ['tajikistan'], hint: 'Asia Tengah' },
    { image: 'https://flagcdn.com/w320/sa.png', answer: ['arab saudi', 'saudi arabia'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/ae.png', answer: ['uni emirat arab', 'uea', 'uae'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/ir.png', answer: ['iran'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/iq.png', answer: ['irak', 'iraq'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/il.png', answer: ['israel'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/jo.png', answer: ['yordania', 'jordan'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/lb.png', answer: ['libanon', 'lebanon'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/sy.png', answer: ['suriah', 'syria'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/ye.png', answer: ['yaman', 'yemen'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/om.png', answer: ['oman'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/kw.png', answer: ['kuwait'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/qa.png', answer: ['qatar'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/bh.png', answer: ['bahrain'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/tr.png', answer: ['turki', 'turkey'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/cy.png', answer: ['siprus', 'cyprus'], hint: 'Timur Tengah' },
    { image: 'https://flagcdn.com/w320/am.png', answer: ['armenia'], hint: 'Asia Barat' },
    { image: 'https://flagcdn.com/w320/az.png', answer: ['azerbaijan'], hint: 'Asia Barat' },
    { image: 'https://flagcdn.com/w320/ge.png', answer: ['georgia'], hint: 'Asia Barat' },
    { image: 'https://flagcdn.com/w320/gb.png', answer: ['inggris', 'uk', 'united kingdom'], hint: 'Eropa Barat' },
    { image: 'https://flagcdn.com/w320/fr.png', answer: ['perancis', 'prancis', 'france'], hint: 'Eropa Barat' },
    { image: 'https://flagcdn.com/w320/de.png', answer: ['jerman', 'germany'], hint: 'Eropa Barat' },
    { image: 'https://flagcdn.com/w320/nl.png', answer: ['belanda', 'netherlands'], hint: 'Eropa Barat' },
    { image: 'https://flagcdn.com/w320/be.png', answer: ['belgia', 'belgium'], hint: 'Eropa Barat' },
    { image: 'https://flagcdn.com/w320/lu.png', answer: ['luksemburg', 'luxembourg'], hint: 'Eropa Barat' },
    { image: 'https://flagcdn.com/w320/ie.png', answer: ['irlandia', 'ireland'], hint: 'Eropa Barat' },
    { image: 'https://flagcdn.com/w320/pt.png', answer: ['portugal'], hint: 'Eropa Barat' },
    { image: 'https://flagcdn.com/w320/es.png', answer: ['spanyol', 'spain'], hint: 'Eropa Barat' },
    { image: 'https://flagcdn.com/w320/ad.png', answer: ['andorra'], hint: 'Eropa Barat' },
    { image: 'https://flagcdn.com/w320/mc.png', answer: ['monako', 'monaco'], hint: 'Eropa Barat' },
    { image: 'https://flagcdn.com/w320/it.png', answer: ['italia', 'italy'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/gr.png', answer: ['yunani', 'greece'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/hr.png', answer: ['kroasia', 'croatia'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/ba.png', answer: ['bosnia', 'bosnia herzegovina'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/rs.png', answer: ['serbia'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/me.png', answer: ['montenegro'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/al.png', answer: ['albania'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/mk.png', answer: ['makedonia', 'north macedonia'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/si.png', answer: ['slovenia'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/sm.png', answer: ['san marino'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/va.png', answer: ['vatikan', 'vatican'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/mt.png', answer: ['malta'], hint: 'Eropa Selatan' },
    { image: 'https://flagcdn.com/w320/ch.png', answer: ['swiss', 'switzerland'], hint: 'Eropa Tengah' },
    { image: 'https://flagcdn.com/w320/at.png', answer: ['austria'], hint: 'Eropa Tengah' },
    { image: 'https://flagcdn.com/w320/cz.png', answer: ['ceko', 'czech', 'czechia'], hint: 'Eropa Tengah' },
    { image: 'https://flagcdn.com/w320/sk.png', answer: ['slovakia'], hint: 'Eropa Tengah' },
    { image: 'https://flagcdn.com/w320/hu.png', answer: ['hungaria', 'hungary'], hint: 'Eropa Tengah' },
    { image: 'https://flagcdn.com/w320/pl.png', answer: ['polandia', 'poland'], hint: 'Eropa Tengah' },
    { image: 'https://flagcdn.com/w320/li.png', answer: ['liechtenstein'], hint: 'Eropa Tengah' },
    { image: 'https://flagcdn.com/w320/se.png', answer: ['swedia', 'sweden'], hint: 'Eropa Utara' },
    { image: 'https://flagcdn.com/w320/no.png', answer: ['norwegia', 'norway'], hint: 'Eropa Utara' },
    { image: 'https://flagcdn.com/w320/dk.png', answer: ['denmark'], hint: 'Eropa Utara' },
    { image: 'https://flagcdn.com/w320/fi.png', answer: ['finlandia', 'finland'], hint: 'Eropa Utara' },
    { image: 'https://flagcdn.com/w320/is.png', answer: ['islandia', 'iceland'], hint: 'Eropa Utara' },
    { image: 'https://flagcdn.com/w320/ee.png', answer: ['estonia'], hint: 'Eropa Utara' },
    { image: 'https://flagcdn.com/w320/lv.png', answer: ['latvia'], hint: 'Eropa Utara' },
    { image: 'https://flagcdn.com/w320/lt.png', answer: ['lithuania', 'lituania'], hint: 'Eropa Utara' },
    { image: 'https://flagcdn.com/w320/ru.png', answer: ['rusia', 'russia'], hint: 'Eropa Timur' },
    { image: 'https://flagcdn.com/w320/ua.png', answer: ['ukraina', 'ukraine'], hint: 'Eropa Timur' },
    { image: 'https://flagcdn.com/w320/by.png', answer: ['belarus'], hint: 'Eropa Timur' },
    { image: 'https://flagcdn.com/w320/md.png', answer: ['moldova'], hint: 'Eropa Timur' },
    { image: 'https://flagcdn.com/w320/ro.png', answer: ['rumania', 'romania'], hint: 'Eropa Timur' },
    { image: 'https://flagcdn.com/w320/bg.png', answer: ['bulgaria'], hint: 'Eropa Timur' },
    { image: 'https://flagcdn.com/w320/xk.png', answer: ['kosovo'], hint: 'Eropa Timur' },
    { image: 'https://flagcdn.com/w320/us.png', answer: ['amerika', 'usa', 'united states', 'as'], hint: 'Amerika Utara' },
    { image: 'https://flagcdn.com/w320/ca.png', answer: ['kanada', 'canada'], hint: 'Amerika Utara' },
    { image: 'https://flagcdn.com/w320/mx.png', answer: ['meksiko', 'mexico'], hint: 'Amerika Utara' },
    { image: 'https://flagcdn.com/w320/gt.png', answer: ['guatemala'], hint: 'Amerika Tengah' },
    { image: 'https://flagcdn.com/w320/bz.png', answer: ['belize'], hint: 'Amerika Tengah' },
    { image: 'https://flagcdn.com/w320/hn.png', answer: ['honduras'], hint: 'Amerika Tengah' },
    { image: 'https://flagcdn.com/w320/sv.png', answer: ['el salvador'], hint: 'Amerika Tengah' },
    { image: 'https://flagcdn.com/w320/ni.png', answer: ['nikaragua', 'nicaragua'], hint: 'Amerika Tengah' },
    { image: 'https://flagcdn.com/w320/cr.png', answer: ['kosta rika', 'costa rica'], hint: 'Amerika Tengah' },
    { image: 'https://flagcdn.com/w320/pa.png', answer: ['panama'], hint: 'Amerika Tengah' },
    { image: 'https://flagcdn.com/w320/cu.png', answer: ['kuba', 'cuba'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/jm.png', answer: ['jamaika', 'jamaica'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/ht.png', answer: ['haiti'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/do.png', answer: ['dominika', 'dominican republic'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/tt.png', answer: ['trinidad dan tobago', 'trinidad and tobago'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/bb.png', answer: ['barbados'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/ag.png', answer: ['antigua dan barbuda', 'antigua and barbuda'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/dm.png', answer: ['dominika', 'dominica'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/gd.png', answer: ['grenada'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/kn.png', answer: ['saint kitts dan nevis', 'saint kitts and nevis'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/lc.png', answer: ['saint lucia'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/vc.png', answer: ['saint vincent', 'saint vincent and the grenadines'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/bs.png', answer: ['bahama', 'bahamas'], hint: 'Karibia' },
    { image: 'https://flagcdn.com/w320/br.png', answer: ['brasil', 'brazil'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/ar.png', answer: ['argentina'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/co.png', answer: ['kolombia', 'colombia'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/ve.png', answer: ['venezuela'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/pe.png', answer: ['peru'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/cl.png', answer: ['chili', 'chile'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/ec.png', answer: ['ekuador', 'ecuador'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/bo.png', answer: ['bolivia'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/py.png', answer: ['paraguay'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/uy.png', answer: ['uruguay'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/gy.png', answer: ['guyana'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/sr.png', answer: ['suriname'], hint: 'Amerika Selatan' },
    { image: 'https://flagcdn.com/w320/eg.png', answer: ['mesir', 'egypt'], hint: 'Afrika Utara' },
    { image: 'https://flagcdn.com/w320/ly.png', answer: ['libya'], hint: 'Afrika Utara' },
    { image: 'https://flagcdn.com/w320/tn.png', answer: ['tunisia'], hint: 'Afrika Utara' },
    { image: 'https://flagcdn.com/w320/dz.png', answer: ['aljazair', 'algeria'], hint: 'Afrika Utara' },
    { image: 'https://flagcdn.com/w320/ma.png', answer: ['maroko', 'morocco'], hint: 'Afrika Utara' },
    { image: 'https://flagcdn.com/w320/sd.png', answer: ['sudan'], hint: 'Afrika Utara' },
    { image: 'https://flagcdn.com/w320/mr.png', answer: ['mauritania'], hint: 'Afrika Utara' },
    { image: 'https://flagcdn.com/w320/ng.png', answer: ['nigeria'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/gh.png', answer: ['ghana'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/sn.png', answer: ['senegal'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/ci.png', answer: ['pantai gading', 'ivory coast', 'cote divoire'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/ml.png', answer: ['mali'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/bf.png', answer: ['burkina faso'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/gn.png', answer: ['guinea'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/sl.png', answer: ['sierra leone'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/lr.png', answer: ['liberia'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/tg.png', answer: ['togo'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/bj.png', answer: ['benin'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/ne.png', answer: ['niger'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/gw.png', answer: ['guinea bissau', 'guinea-bissau'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/gm.png', answer: ['gambia'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/cv.png', answer: ['tanjung verde', 'cape verde', 'cabo verde'], hint: 'Afrika Barat' },
    { image: 'https://flagcdn.com/w320/cd.png', answer: ['kongo', 'drc', 'democratic republic of the congo'], hint: 'Afrika Tengah' },
    { image: 'https://flagcdn.com/w320/cg.png', answer: ['republik kongo', 'republic of the congo'], hint: 'Afrika Tengah' },
    { image: 'https://flagcdn.com/w320/cm.png', answer: ['kamerun', 'cameroon'], hint: 'Afrika Tengah' },
    { image: 'https://flagcdn.com/w320/cf.png', answer: ['republik afrika tengah', 'central african republic'], hint: 'Afrika Tengah' },
    { image: 'https://flagcdn.com/w320/td.png', answer: ['chad'], hint: 'Afrika Tengah' },
    { image: 'https://flagcdn.com/w320/ga.png', answer: ['gabon'], hint: 'Afrika Tengah' },
    { image: 'https://flagcdn.com/w320/gq.png', answer: ['guinea khatulistiwa', 'equatorial guinea'], hint: 'Afrika Tengah' },
    { image: 'https://flagcdn.com/w320/st.png', answer: ['sao tome dan principe', 'sao tome and principe'], hint: 'Afrika Tengah' },
    { image: 'https://flagcdn.com/w320/ke.png', answer: ['kenya'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/tz.png', answer: ['tanzania'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/ug.png', answer: ['uganda'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/et.png', answer: ['etiopia', 'ethiopia'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/so.png', answer: ['somalia'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/dj.png', answer: ['djibouti', 'jibuti'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/er.png', answer: ['eritrea'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/rw.png', answer: ['rwanda'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/bi.png', answer: ['burundi'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/ss.png', answer: ['sudan selatan', 'south sudan'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/mz.png', answer: ['mozambik', 'mozambique'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/mg.png', answer: ['madagaskar', 'madagascar'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/km.png', answer: ['komoro', 'comoros'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/sc.png', answer: ['seychelles'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/mu.png', answer: ['mauritius'], hint: 'Afrika Timur' },
    { image: 'https://flagcdn.com/w320/za.png', answer: ['afrika selatan', 'south africa'], hint: 'Afrika Selatan' },
    { image: 'https://flagcdn.com/w320/zm.png', answer: ['zambia'], hint: 'Afrika Selatan' },
    { image: 'https://flagcdn.com/w320/zw.png', answer: ['zimbabwe'], hint: 'Afrika Selatan' },
    { image: 'https://flagcdn.com/w320/bw.png', answer: ['botswana'], hint: 'Afrika Selatan' },
    { image: 'https://flagcdn.com/w320/na.png', answer: ['namibia'], hint: 'Afrika Selatan' },
    { image: 'https://flagcdn.com/w320/ls.png', answer: ['lesotho'], hint: 'Afrika Selatan' },
    { image: 'https://flagcdn.com/w320/sz.png', answer: ['eswatini', 'swaziland'], hint: 'Afrika Selatan' },
    { image: 'https://flagcdn.com/w320/ao.png', answer: ['angola'], hint: 'Afrika Selatan' },
    { image: 'https://flagcdn.com/w320/mw.png', answer: ['malawi'], hint: 'Afrika Selatan' },
    { image: 'https://flagcdn.com/w320/au.png', answer: ['australia'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/nz.png', answer: ['selandia baru', 'new zealand'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/pg.png', answer: ['papua nugini', 'papua new guinea'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/fj.png', answer: ['fiji'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/sb.png', answer: ['kepulauan solomon', 'solomon islands'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/vu.png', answer: ['vanuatu'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/ws.png', answer: ['samoa'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/to.png', answer: ['tonga'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/ki.png', answer: ['kiribati'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/fm.png', answer: ['mikronesia', 'micronesia'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/mh.png', answer: ['kepulauan marshall', 'marshall islands'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/pw.png', answer: ['palau'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/nr.png', answer: ['nauru'], hint: 'Oseania' },
    { image: 'https://flagcdn.com/w320/tv.png', answer: ['tuvalu'], hint: 'Oseania' },
];

const FLAG_TIMEOUT_MS = 30000;
const TTT_TIMEOUT_MS  = 60000;
const WIN_REWARD_TTT  = 15000;
const WIN_REWARD_TB   = 5000;

// ── Math config ───────────────────────────────────────
const MATH_CONFIG = {
    easy:       { label: 'Easy',       emoji: '🟢', timeout: 30, xp: 5,  reward: 1000,  ops: ['+','-'] },
    normal:     { label: 'Normal',     emoji: '🟡', timeout: 30, xp: 10, reward: 3000,  ops: ['+','-','x'] },
    hard:       { label: 'Hard',       emoji: '🔴', timeout: 25, xp: 20, reward: 7000,  ops: ['+','-','x','/'] },
    extreme:    { label: 'Extreme',    emoji: '🟣', timeout: 20, xp: 35, reward: 15000, ops: ['+','-','x','/','pow'] },
    impossible: { label: 'Impossible', emoji: '⚫', timeout: 15, xp: 60, reward: 30000, ops: ['+','-','x','/','pow','sqrt'] },
};

function generateMath(difficulty) {
    const cfg = MATH_CONFIG[difficulty];
    const op  = cfg.ops[Math.floor(Math.random() * cfg.ops.length)];
    const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

    let question, answer;

    if (op === 'pow') {
        let base, exp = 2;
        if (difficulty === 'impossible') {
            if (Math.random() < 0.5) { 
                base = rand(10, 30); exp = 3; 
                question = base + '³';
            } else { 
                base = rand(50, 150); 
                question = base + '²';
            }
        } else { 
            base = rand(15, 40);
            question = base + '²';
        }
        answer = Math.pow(base, exp);

    } else if (op === 'sqrt') {
        const base = rand(50, 300);
        question = '√' + (base * base);
        answer = base;

    } else if (op === '/') {
        let res, div;
        if (difficulty === 'impossible') { res = rand(50, 500); div = rand(20, 200); }
        else if (difficulty === 'extreme') { res = rand(20, 100); div = rand(10, 50); }
        else { res = rand(5, 50); div = rand(2, 20); }

        const a = res * div;
        question = a + ' / ' + div;
        answer = res;

    } else if (op === 'x') {
        let a, b;
        if (difficulty === 'impossible') { a = rand(100, 500); b = rand(50, 200); }
        else if (difficulty === 'extreme') { a = rand(20, 100); b = rand(10, 50); }
        else if (difficulty === 'hard') { a = rand(10, 50); b = rand(5, 20); }
        else { a = rand(2, 12); b = rand(2, 12); }

        question = a + ' x ' + b;
        answer = a * b;

    } else { 
        let a, b;
        if (difficulty === 'impossible') { a = rand(5000, 99999); b = rand(5000, 99999); }
        else if (difficulty === 'extreme') { a = rand(500, 5000); b = rand(500, 5000); }
        else if (difficulty === 'hard') { a = rand(50, 500); b = rand(50, 500); }
        else if (difficulty === 'normal') { a = rand(10, 100); b = rand(10, 100); }
        else { a = rand(1, 20); b = rand(1, 20); } 

        if (op === '+') {
            question = a + ' + ' + b; answer = a + b;
        } else {
            const big = Math.max(a, b);
            const small = Math.min(a, b);
            question = big + ' - ' + small; answer = big - small;
        }
    }

    return { question, answer };
}

const TTT_SYMBOLS = { X: '✖️', O: '⭕' };
const TTT_EMPTY   = '➖';
const TTT_WINS    = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const noyaFooter  = `\n· · ────────────── · ·\n> ${global.botFooter || '🍁 _Powered by Noya Company_ 𖹭.ᐟ'}\n· · ────────────── · ·`;

function renderBoard(board) {
    const b = board.map(c => c ? TTT_SYMBOLS[c] : TTT_EMPTY);
    return '┌─────────────────────\n│  ﹒ ' + b[0]+' '+b[1]+' '+b[2] +
           '\n│  ﹒ ' + b[3]+' '+b[4]+' '+b[5] +
           '\n│  ﹒ ' + b[6]+' '+b[7]+' '+b[8] + '\n└─────────────────────';
}

function checkWinner(board) {
    for (const [a,b,c] of TTT_WINS)
        if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
    return null;
}

function isDraw(board) { return board.every(c => c !== null); }

// ════════════════════════════════════════════════════════
const gameCmd = async function(sock, msg, command, args, dbs, sender, prefix) {
    const from    = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    if (!isGroup) return await sock.sendMessage(from, { text: 'Fitur game hanya bisa digunakan di dalam grup.' }, { quoted: msg });
    if (!dbs.gameDb) dbs.gameDb = {};

    // ── TTT STATS ─────────────────────────────────────
    if (command === 'tttwr') {
        if (!dbs.tttStatDb) dbs.tttStatDb = {};
        const stats = dbs.tttStatDb[sender] || { wins: 0, losses: 0, draws: 0 };
        const total = stats.wins + stats.losses + stats.draws;
        const wr    = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : 0;
        return await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║  ⋆. 𐙚˚࿔ *TTT STATS* 𝜗𝜚˚⋆  ║\n╚══════════════════════╝\n\n✿ *PLAYER INFO*\n┌─────────────────────\n│ ﹒👤 Name   : @'+sender.split('@')[0]+'\n│ ﹒🏆 Menang : '+stats.wins+' Match\n│ ﹒💀 Kalah  : '+stats.losses+' Match\n│ ﹒🤝 Seri   : '+stats.draws+' Match\n│ ﹒📈 W R    : *'+wr+'%*\n└─────────────────────'+noyaFooter,
            mentions: [sender]
        }, { quoted: msg });
    }

    // ── TEBAK BENDERA ─────────────────────────────────
    if (command === 'tb' || command === 'tebakbendera') {
        if (dbs.gameDb[from]?.type === 'flag') {
            const ex = dbs.gameDb[from];
            return await sock.sendMessage(from, { text: '⚠️ Masih ada game tebak bendera yang berjalan!\n\nHint: *'+ex.hint+'*\nSisa waktu: *'+Math.max(0,Math.ceil((ex.expiresAt-Date.now())/1000))+' detik*' }, { quoted: msg });
        }
        const flag = FLAGS[Math.floor(Math.random() * FLAGS.length)];
        const expiresAt = Date.now() + FLAG_TIMEOUT_MS;
        dbs.gameDb[from] = { type: 'flag', image: flag.image, answers: flag.answer, hint: flag.hint, expiresAt, startedBy: sender };
        await saveDb('gameDb');
        setTimeout(async () => {
            if (dbs.gameDb[from]?.type === 'flag' && dbs.gameDb[from]?.expiresAt === expiresAt) {
                const correct = dbs.gameDb[from].answers[0];
                delete dbs.gameDb[from]; await saveDb('gameDb');
                await sock.sendMessage(from, { text: '╔══════════════════════╗\n║  ⋆. 𐙚˚࿔ *TIME OUT* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n⏰ Waktu habis!\n\nJawaban: 🚩 *'+correct.toUpperCase()+'*'+noyaFooter });
            }
        }, FLAG_TIMEOUT_MS);
        return await sock.sendMessage(from, {
            image: { url: flag.image },
            caption: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *GUESS FLAG* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *PERTANYAAN*\n┌─────────────────────\n│ ﹒Negara mana ini?\n│ ﹒💡 Hint: *'+flag.hint+'*\n└─────────────────────\n\n· · ────────────── · ·\n> _Ketik jawabanmu! Waktu 30 detik_ ✦'
        });
    }

    // ── TIC TAC TOE ───────────────────────────────────
    if (command === 'ttt' || command === 'tictactoe') {
        const mentionedJid      = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = msg.message.extendedTextMessage?.contextInfo?.participant;
        const opponent          = mentionedJid[0] || quotedParticipant;
        if (!opponent) return await sock.sendMessage(from, { text: 'Cara main: '+prefix+'ttt @lawan' }, { quoted: msg });
        if (opponent === sender) return await sock.sendMessage(from, { text: 'Kamu tidak bisa main melawan dirimu sendiri.' }, { quoted: msg });
        if (dbs.gameDb[from]?.type === 'ttt') return await sock.sendMessage(from, { text: 'Masih ada game Tic Tac Toe yang sedang berjalan di grup ini.' }, { quoted: msg });
        const expiresAt = Date.now() + TTT_TIMEOUT_MS;
        dbs.gameDb[from] = { type: 'ttt', status: 'pending', challenger: sender, opponent, expiresAt };
        await saveDb('gameDb');
        setTimeout(async () => {
            if (dbs.gameDb[from]?.type === 'ttt' && dbs.gameDb[from]?.status === 'pending' && dbs.gameDb[from]?.expiresAt === expiresAt) {
                delete dbs.gameDb[from]; await saveDb('gameDb');
                await sock.sendMessage(from, { text: '⏳ Tantangan dibatalkan karena @'+opponent.split('@')[0]+' tidak merespons.', mentions: [opponent] });
            }
        }, TTT_TIMEOUT_MS);
        return await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *CHALLENGE!* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n🎮 @'+sender.split('@')[0]+' menantang @'+opponent.split('@')[0]+' bermain Tic Tac Toe!\n\n@'+opponent.split('@')[0]+', balas dengan:\nKetik *y* (Terima) atau *n* (Tolak)\n\n_Waktu konfirmasi: 60 detik._'+noyaFooter,
            mentions: [sender, opponent]
        });
    }

    // ── MATH ─────────────────────────────────────────
    if (command === 'math') {
        if (dbs.gameDb[from]?.type === 'math') {
            const ex = dbs.gameDb[from];
            return await sock.sendMessage(from, { text: '⚠️ Masih ada soal math yang berjalan!\n\n❓ *'+ex.question+'*\nSisa waktu: *'+Math.max(0,Math.ceil((ex.expiresAt-Date.now())/1000))+' detik*' }, { quoted: msg });
        }
        
        const inputArgs = (args[0] || '').toLowerCase();
        let level;

        if (['e', 'easy'].includes(inputArgs)) level = 'easy';
        else if (['n', 'normal'].includes(inputArgs)) level = 'normal';
        else if (['h', 'hard'].includes(inputArgs)) level = 'hard';
        else if (['ex', 'extreme'].includes(inputArgs)) level = 'extreme';
        else if (['i', 'im', 'impossible'].includes(inputArgs)) level = 'impossible';
        else if (['r', 'random'].includes(inputArgs)) {
            const levels = Object.keys(MATH_CONFIG);
            level = levels[Math.floor(Math.random() * levels.length)];
        }

        if (!level) {
            return await sock.sendMessage(from, { text: `Pilih level:\n\n ${prefix}math e / easy\n ${prefix}math n / normal\n ${prefix}math h / hard\n ${prefix}math ex / extreme\n ${prefix}math i / impossible\n ${prefix}math r / random` }, { quoted: msg });
        }

        const cfg   = MATH_CONFIG[level];
        const { question, answer } = generateMath(level);
        const expiresAt = Date.now() + cfg.timeout * 1000;
        
        dbs.gameDb[from] = { type: 'math', level, question, answer, expiresAt, startedBy: sender };
        await saveDb('gameDb');
        
        setTimeout(async () => {
            if (dbs.gameDb[from]?.type === 'math' && dbs.gameDb[from]?.expiresAt === expiresAt) {
                const correct = dbs.gameDb[from].answer;
                delete dbs.gameDb[from]; await saveDb('gameDb');
                await sock.sendMessage(from, { text: '╔══════════════════════╗\n║  ⋆. 𐙚˚࿔ *TIME OUT* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n⏰ Waktu habis!\n\nJawaban: *'+correct+'*'+noyaFooter });
            }
        }, cfg.timeout * 1000);
        
        return await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *MATH QUIZ* 𝜗𝜚˚⋆  ║\n╚══════════════════════╝\n\n✿ *SOAL*\n┌─────────────────────\n│ ﹒'+cfg.emoji+' Level  : *'+cfg.label+'*\n│ ﹒❓ Soal   : *'+question+' = ?*\n│ \n│ ﹒⏱️ Waktu  : *'+cfg.timeout+' detik*\n│ ﹒🎁 Reward : *+'+cfg.xp+' XP | +Rp'+cfg.reward.toLocaleString('id-ID')+'*\n└─────────────────────\n\n· · ────────────── · ·\n> _Ketik jawabanmu!_ ✦'
        });
    }

    // ── NYERAH ────────────────────────────────────────
    if (command === 'nyerah') {
        const game = dbs.gameDb[from];
        if (!game) return await sock.sendMessage(from, { text: 'Tidak ada game yang sedang berjalan.' }, { quoted: msg });

        if (game.type === 'ttt' && game.status === 'playing') {
            const isPlayer = game.players.X === sender || game.players.O === sender;
            if (!isPlayer) return await sock.sendMessage(from, { text: 'Kamu bukan pemain di game ini.' }, { quoted: msg });
            const loser  = sender;
            const winner = game.players.X === sender ? game.players.O : game.players.X;
            delete dbs.gameDb[from]; await saveDb('gameDb');
            if (!dbs.tttStatDb) dbs.tttStatDb = {};
            if (!dbs.tttStatDb[winner]) dbs.tttStatDb[winner] = { wins: 0, losses: 0, draws: 0 };
            if (!dbs.tttStatDb[loser])  dbs.tttStatDb[loser]  = { wins: 0, losses: 0, draws: 0 };
            dbs.tttStatDb[winner].wins  += 1;
            dbs.tttStatDb[loser].losses += 1;
            await saveDb('tttStatDb');
            const xpResult = await awardXp(dbs, saveDb, winner, 30);
            const levelStr = xpResult?.leveledUp ? '\n│ ﹒🎉 *LEVEL UP!* -> Level '+xpResult.newLevel : '';
            if (!dbs.ecoDb) dbs.ecoDb = {};
            if (!dbs.ecoDb[winner]) dbs.ecoDb[winner] = { balance: 0 };
            dbs.ecoDb[winner].balance += WIN_REWARD_TTT;
            await saveDb('ecoDb');
            return await sock.sendMessage(from, {
                text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *GIVE UP!* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *RESULT*\n┌─────────────────────\n│ ﹒🏳️ @'+loser.split('@')[0]+' menyerah!\n│ ﹒🏆 @'+winner.split('@')[0]+' menang!\n│ \n│ ﹒🎁 Reward:\n│ ﹒+ 30 XP\n│ ﹒+ Rp'+WIN_REWARD_TTT.toLocaleString('id-ID')+levelStr+'\n└─────────────────────'+noyaFooter,
                mentions: [loser, winner]
            }, { quoted: msg });
        }

        if (game.type === 'flag' || game.type === 'math') {
            const correct = game.type === 'flag' ? game.answers[0] : game.answer;
            const label   = game.type === 'flag' ? '🚩 Bendera' : '🔢 Jawaban';
            delete dbs.gameDb[from]; await saveDb('gameDb');
            return await sock.sendMessage(from, {
                text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *GIVE UP!* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n🏳️ @'+sender.split('@')[0]+' menyerah!\n\n'+label+': *'+String(correct).toUpperCase()+'*'+noyaFooter,
                mentions: [sender]
            }, { quoted: msg });
        }

        if (game.type === 'ttt' && game.status === 'pending') {
            if (sender !== game.challenger && sender !== game.opponent) return await sock.sendMessage(from, { text: 'Kamu bukan bagian dari game ini.' }, { quoted: msg });
            delete dbs.gameDb[from]; await saveDb('gameDb');
            return await sock.sendMessage(from, { text: '❌ Tantangan dibatalkan oleh @'+sender.split('@')[0]+'.', mentions: [sender] }, { quoted: msg });
        }

        return await sock.sendMessage(from, { text: 'Tidak ada game aktif yang bisa dihentikan.' }, { quoted: msg });
    }

    // ── STOPGAME ──────────────────────────────────────
    if (command === 'stopgame') {
        if (!dbs.gameDb[from]) return await sock.sendMessage(from, { text: 'Tidak ada game yang sedang berjalan.' }, { quoted: msg });
        delete dbs.gameDb[from]; await saveDb('gameDb');
        return await sock.sendMessage(from, { text: '✅ Game berhasil dihentikan secara paksa.' }, { quoted: msg });
    }

    // ── WEREWOLF WINRATE ──────────────────────────────
    if (command === 'wwwr' || command === 'werewolfwinrate') {
        if (!dbs.wwStatDb) dbs.wwStatDb = {};
        const stats = dbs.wwStatDb[sender] || { winsWerewolf: 0, winsVillager: 0, losses: 0, gamesPlayed: 0 };
        const total = stats.gamesPlayed || 0;
        const totalWins = (stats.winsWerewolf || 0) + (stats.winsVillager || 0);
        const wr = total > 0 ? ((totalWins / total) * 100).toFixed(1) : 0;
        return await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║  ⋆. 𐙚˚࿔ *WW STATS* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *PLAYER INFO*\n┌─────────────────────\n│ ﹒👤 Name      : @' + sender.split('@')[0] + '\n│ ﹒🐺 Menang WW : ' + (stats.winsWerewolf || 0) + ' Match\n│ ﹒🏘️ Menang WG : ' + (stats.winsVillager || 0) + ' Match\n│ ﹒💀 Kalah     : ' + (stats.losses || 0) + ' Match\n│ ﹒🎮 Total     : ' + total + ' Match\n│ ﹒📈 W R       : *' + wr + '%*\n└─────────────────────' + noyaFooter,
            mentions: [sender]
        }, { quoted: msg });
    }

    // ── WEREWOLF ──────────────────────────────────────
    if (command === 'ww' || command === 'werewolf') {
        if (!isGroup) return await sock.sendMessage(from, { text: 'Fitur Werewolf hanya bisa digunakan di dalam grup.' }, { quoted: msg });

        if (dbs.gameDb[from]?.type === 'werewolf') {
            const ww = dbs.gameDb[from];
            if (ww.phase === 'lobby') {
                const playerList = ww.players.map((p, i) => '│ ﹒' + (i + 1) + '. @' + p.split('@')[0]).join('\n');
                return await sock.sendMessage(from, {
                    text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *LOBBY*\n┌─────────────────────\n' + playerList + '\n└─────────────────────\n\n│ ﹒👥 Pemain  : *' + ww.players.length + '/' + ww.maxPlayers + '*\n│ ﹒⏳ Ketik *' + prefix + 'wwjoin* untuk bergabung\n│ ﹒🚀 Ketik *' + prefix + 'wwstart* untuk mulai\n└─────────────────────' + noyaFooter,
                    mentions: ww.players
                }, { quoted: msg });
            }
            return await sock.sendMessage(from, { text: '⚠️ Game Werewolf sedang berjalan di grup ini!' }, { quoted: msg });
        }

        const inputMax = parseInt(args[0]);
        const validSizes = [5, 7, 9];
        if (!validSizes.includes(inputMax)) {
            return await sock.sendMessage(from, {
                text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *CARA MAIN*\n┌─────────────────────\n│ ﹒' + prefix + 'ww 5  → 5 pemain\n│ ﹒' + prefix + 'ww 7  → 7 pemain\n│ ﹒' + prefix + 'ww 9  → 9 pemain\n└─────────────────────\n\n> _Setelah room dibuat, pemain lain ketik_ *' + prefix + 'wwjoin* ✦'
            }, { quoted: msg });
        }

        dbs.gameDb[from] = {
            type: 'werewolf',
            phase: 'lobby',
            maxPlayers: inputMax,
            players: [sender],
            host: sender,
            createdAt: Date.now()
        };
        await saveDb('gameDb');

        return await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *ROOM DIBUAT!*\n┌─────────────────────\n│ ﹒🎮 Host    : @' + sender.split('@')[0] + '\n│ ﹒👥 Kapasitas: *' + inputMax + ' pemain*\n│ ﹒✅ Joined  : *1/' + inputMax + '*\n└─────────────────────\n\n> _Ketik_ *' + prefix + 'wwjoin* _untuk bergabung!_\n> _Host ketik_ *' + prefix + 'wwstart* _untuk mulai!_ ✦' + noyaFooter,
            mentions: [sender]
        }, { quoted: msg });
    }

    // ── WEREWOLF JOIN ─────────────────────────────────
    if (command === 'wwjoin') {
        if (!isGroup) return;
        const ww = dbs.gameDb[from];
        if (!ww || ww.type !== 'werewolf' || ww.phase !== 'lobby') {
            return await sock.sendMessage(from, { text: '⚠️ Tidak ada lobby Werewolf yang aktif. Buat dulu dengan *' + prefix + 'ww 5/7/9*' }, { quoted: msg });
        }
        if (ww.players.includes(sender)) {
            return await sock.sendMessage(from, { text: '⚠️ Kamu sudah bergabung ke lobby ini!' }, { quoted: msg });
        }
        if (ww.players.length >= ww.maxPlayers) {
            return await sock.sendMessage(from, { text: '⚠️ Lobby sudah penuh! (' + ww.maxPlayers + '/' + ww.maxPlayers + ')' }, { quoted: msg });
        }
        ww.players.push(sender);
        dbs.gameDb[from] = ww;
        await saveDb('gameDb');

        const playerList = ww.players.map((p, i) => '│ ﹒' + (i + 1) + '. @' + p.split('@')[0]).join('\n');
        return await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *PLAYER JOINED!*\n┌─────────────────────\n' + playerList + '\n└─────────────────────\n\n│ ﹒👥 *' + ww.players.length + '/' + ww.maxPlayers + '* pemain bergabung\n└─────────────────────' + noyaFooter,
            mentions: ww.players
        }, { quoted: msg });
    }

    // ── WEREWOLF START ────────────────────────────────
    if (command === 'wwstart') {
        if (!isGroup) return;
        const ww = dbs.gameDb[from];
        if (!ww || ww.type !== 'werewolf' || ww.phase !== 'lobby') {
            return await sock.sendMessage(from, { text: '⚠️ Tidak ada lobby Werewolf yang aktif.' }, { quoted: msg });
        }
        if (ww.host !== sender) {
            return await sock.sendMessage(from, { text: '⚠️ Hanya host yang bisa memulai game!' }, { quoted: msg });
        }
        if (ww.players.length < ww.maxPlayers) {
            return await sock.sendMessage(from, { text: '⚠️ Lobby belum penuh! (' + ww.players.length + '/' + ww.maxPlayers + ' pemain)' }, { quoted: msg });
        }

        // Assign roles based on player count
        const roleConfigs = {
            5: { werewolf: 1, seer: 1, doctor: 1, villager: 2 },
            7: { werewolf: 2, seer: 1, doctor: 1, villager: 3 },
            9: { werewolf: 2, seer: 1, doctor: 1, bodyguard: 1, villager: 4 }
        };
        const cfg = roleConfigs[ww.maxPlayers];
        const rolePool = [];
        for (let i = 0; i < cfg.werewolf;   i++) rolePool.push('werewolf');
        for (let i = 0; i < cfg.seer;       i++) rolePool.push('seer');
        for (let i = 0; i < cfg.doctor;     i++) rolePool.push('doctor');
        if (cfg.bodyguard) for (let i = 0; i < cfg.bodyguard; i++) rolePool.push('bodyguard');
        for (let i = 0; i < cfg.villager;   i++) rolePool.push('villager');

        // Shuffle roles
        for (let i = rolePool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
        }

        const roleEmoji = { werewolf: '🐺', seer: '🔮', doctor: '💊', bodyguard: '🛡️', villager: '🏘️' };
        const roleName  = { werewolf: 'Werewolf', seer: 'Seer', doctor: 'Doctor', bodyguard: 'Bodyguard', villager: 'Villager' };
        const roleDesc  = {
            werewolf:  'Setiap malam kamu bisa membunuh satu pemain. Sembunyikan identitasmu!',
            seer:      'Setiap malam kamu bisa melihat peran satu pemain.',
            doctor:    'Setiap malam kamu bisa melindungi satu pemain dari serangan Werewolf.',
            bodyguard: 'Setiap malam kamu bisa melindungi satu pemain. Jika diserang, kamu yang mati.',
            villager:  'Kamu adalah warga biasa. Temukan Werewolf sebelum mereka membunuh semua orang!'
        };

        const playerRoles = {};
        const shuffledPlayers = [...ww.players].sort(() => Math.random() - 0.5);
        shuffledPlayers.forEach((p, i) => { playerRoles[p] = rolePool[i]; });

        // Find werewolves
        const werewolves = Object.entries(playerRoles).filter(([, r]) => r === 'werewolf').map(([p]) => p);

        // Update game state to playing
        dbs.gameDb[from] = {
            type: 'werewolf',
            phase: 'day',
            round: 1,
            players: ww.players,
            alivePlayers: [...ww.players],
            playerRoles,
            votes: {},
            nightActions: {},
            protected: null,
            host: ww.host,
            maxPlayers: ww.maxPlayers,
            lastKilled: null
        };
        await saveDb('gameDb');

        // Send private role messages to each player
        for (const [player, role] of Object.entries(playerRoles)) {
            let extraInfo = '';
            if (role === 'werewolf' && werewolves.length > 1) {
                const teammates = werewolves.filter(w => w !== player).map(w => '@' + w.split('@')[0]).join(', ');
                extraInfo = '\n│ ﹒🤝 Rekan WW : ' + teammates;
            }
            try {
                await sock.sendMessage(player, {
                    text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *PERANMU*\n┌─────────────────────\n│ ﹒' + roleEmoji[role] + ' Role   : *' + roleName[role] + '*' + extraInfo + '\n│ ﹒📖 Info   : ' + roleDesc[role] + '\n└─────────────────────' + noyaFooter
                });
            } catch (e) { /* DM might fail if blocked */ }
        }

        const playerList = ww.players.map((p, i) => '│ ﹒' + (i + 1) + '. @' + p.split('@')[0]).join('\n');
        await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *GAME DIMULAI!*\n┌─────────────────────\n' + playerList + '\n└─────────────────────\n\n│ ﹒📩 Peran sudah dikirim ke DM masing-masing!\n│ ﹒⚠️ Jangan bocorkan peranmu!\n└─────────────────────\n\n╔══════════════════════╗\n║  ☀️ *SIANG - RONDE 1*  ║\n╚══════════════════════╝\n\n✿ *DISKUSI*\n┌─────────────────────\n│ ﹒Diskusikan siapa Werewolf-nya!\n│ ﹒Gunakan *' + prefix + 'wwvote @pemain* untuk voting.\n│ ﹒Pemain dengan vote terbanyak akan dieksekusi.\n│ ﹒Ketik *' + prefix + 'wwend* untuk akhiri siang & mulai malam.\n└─────────────────────' + noyaFooter,
            mentions: ww.players
        }, { quoted: msg });
        return;
    }

    // ── WEREWOLF VOTE ─────────────────────────────────
    if (command === 'wwvote') {
        if (!isGroup) return;
        const ww = dbs.gameDb[from];
        if (!ww || ww.type !== 'werewolf' || ww.phase !== 'day') {
            return await sock.sendMessage(from, { text: '⚠️ Tidak ada sesi voting Werewolf saat ini.' }, { quoted: msg });
        }
        if (!ww.alivePlayers.includes(sender)) {
            return await sock.sendMessage(from, { text: '⚠️ Kamu sudah tereliminasi dan tidak bisa voting.' }, { quoted: msg });
        }
        const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const target = mentionedJid[0];
        if (!target) return await sock.sendMessage(from, { text: 'Cara: *' + prefix + 'wwvote @pemain*' }, { quoted: msg });
        if (!ww.alivePlayers.includes(target)) {
            return await sock.sendMessage(from, { text: '⚠️ Pemain itu tidak ada atau sudah tereliminasi.' }, { quoted: msg });
        }
        if (target === sender) return await sock.sendMessage(from, { text: '⚠️ Kamu tidak bisa vote dirimu sendiri!' }, { quoted: msg });

        ww.votes[sender] = target;
        dbs.gameDb[from] = ww;
        await saveDb('gameDb');

        // Count votes
        const voteCounts = {};
        for (const v of Object.values(ww.votes)) voteCounts[v] = (voteCounts[v] || 0) + 1;
        const voteBoard = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]).map(([p, c]) => '│ ﹒@' + p.split('@')[0] + ' : ' + c + ' vote').join('\n');

        return await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *VOTE TERCATAT*\n┌─────────────────────\n│ ﹒✅ @' + sender.split('@')[0] + ' vote ke @' + target.split('@')[0] + '\n└─────────────────────\n\n✿ *VOTE BOARD*\n┌─────────────────────\n' + voteBoard + '\n└─────────────────────' + noyaFooter,
            mentions: [sender, target]
        }, { quoted: msg });
    }

    // ── WEREWOLF END DAY ──────────────────────────────
    if (command === 'wwend') {
        if (!isGroup) return;
        const ww = dbs.gameDb[from];
        if (!ww || ww.type !== 'werewolf') {
            return await sock.sendMessage(from, { text: '⚠️ Tidak ada game Werewolf yang sedang berjalan.' }, { quoted: msg });
        }

        if (ww.phase === 'day') {
            if (ww.host !== sender) return await sock.sendMessage(from, { text: '⚠️ Hanya host yang bisa mengakhiri siang.' }, { quoted: msg });

            // Tally votes
            const voteCounts = {};
            for (const v of Object.values(ww.votes)) voteCounts[v] = (voteCounts[v] || 0) + 1;
            let eliminated = null;
            let maxVotes = 0;
            for (const [p, c] of Object.entries(voteCounts)) {
                if (c > maxVotes) { maxVotes = c; eliminated = p; }
            }

            let eliminatedMsg = '';
            if (eliminated && maxVotes > 0) {
                ww.alivePlayers = ww.alivePlayers.filter(p => p !== eliminated);
                eliminatedMsg = '\n✿ *EKSEKUSI*\n┌─────────────────────\n│ ﹒⚰️ @' + eliminated.split('@')[0] + ' dieksekusi warga!\n│ ﹒🎭 Perannya adalah: *' + (ww.playerRoles[eliminated] ? ww.playerRoles[eliminated].toUpperCase() : '???') + '*\n└─────────────────────';
                ww.lastKilled = eliminated;
            } else {
                eliminatedMsg = '\n✿ *VOTING*\n┌─────────────────────\n│ ﹒🤝 Tidak ada yang tereliminasi (tidak ada vote)\n└─────────────────────';
            }

            // Check win condition
            const wwAlive = ww.alivePlayers.filter(p => ww.playerRoles[p] === 'werewolf').length;
            const vilAlive = ww.alivePlayers.filter(p => ww.playerRoles[p] !== 'werewolf').length;

            if (wwAlive === 0) {
                // Villagers win
                await _handleWWWin(sock, msg, from, ww, 'villager', dbs, saveDb, noyaFooter);
                return;
            }
            if (wwAlive >= vilAlive) {
                // Werewolves win
                await _handleWWWin(sock, msg, from, ww, 'werewolf', dbs, saveDb, noyaFooter);
                return;
            }

            // Move to night
            ww.phase = 'night';
            ww.votes = {};
            ww.nightActions = {};
            ww.protected = null;
            dbs.gameDb[from] = ww;
            await saveDb('gameDb');

            const aliveList = ww.alivePlayers.map((p, i) => '│ ﹒' + (i + 1) + '. @' + p.split('@')[0]).join('\n');
            await sock.sendMessage(from, {
                text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n' + eliminatedMsg + '\n\n╔══════════════════════╗\n║  🌙 *MALAM TIBA...*   ║\n╚══════════════════════╝\n\n✿ *PEMAIN HIDUP*\n┌─────────────────────\n' + aliveList + '\n└─────────────────────\n\n│ ﹒🐺 *Werewolf* → DM bot: *kill @target*\n│ ﹒🔮 *Seer* → DM bot: *check @target*\n│ ﹒💊 *Doctor* → DM bot: *save @target*\n│ ﹒🛡️ *Bodyguard* → DM bot: *guard @target*\n│ ﹒Host ketik *' + prefix + 'wwdawn* untuk pagi hari\n└─────────────────────' + noyaFooter,
                mentions: ww.alivePlayers
            }, { quoted: msg });
            return;
        }

        if (ww.phase === 'night') {
            // wwdawn alias
            if (ww.host !== sender) return await sock.sendMessage(from, { text: '⚠️ Hanya host yang bisa mengakhiri malam.' }, { quoted: msg });
        }
    }

    // ── WEREWOLF DAWN ─────────────────────────────────
    if (command === 'wwdawn') {
        if (!isGroup) return;
        const ww = dbs.gameDb[from];
        if (!ww || ww.type !== 'werewolf' || ww.phase !== 'night') {
            return await sock.sendMessage(from, { text: '⚠️ Tidak sedang dalam fase malam.' }, { quoted: msg });
        }
        if (ww.host !== sender) return await sock.sendMessage(from, { text: '⚠️ Hanya host yang bisa memulai pagi.' }, { quoted: msg });

        const killed = ww.nightActions['kill'];
        const saved = ww.nightActions['save'] || ww.nightActions['guard'];
        let killMsg = '';

        if (killed && killed !== saved) {
            ww.alivePlayers = ww.alivePlayers.filter(p => p !== killed);
            killMsg = '\n✿ *KORBAN MALAM*\n┌─────────────────────\n│ ﹒🩸 @' + killed.split('@')[0] + ' ditemukan tewas!\n│ ﹒🎭 Perannya adalah: *' + (ww.playerRoles[killed] ? ww.playerRoles[killed].toUpperCase() : '???') + '*\n└─────────────────────';
        } else if (killed && killed === saved) {
            killMsg = '\n✿ *MALAM INI*\n┌─────────────────────\n│ ﹒✨ Semua selamat malam ini! Seseorang diselamatkan.\n└─────────────────────';
        } else {
            killMsg = '\n✿ *MALAM INI*\n┌─────────────────────\n│ ﹒🌙 Malam berlalu dengan tenang. Tidak ada korban.\n└─────────────────────';
        }

        // Check win condition
        const wwAlive = ww.alivePlayers.filter(p => ww.playerRoles[p] === 'werewolf').length;
        const vilAlive = ww.alivePlayers.filter(p => ww.playerRoles[p] !== 'werewolf').length;

        if (wwAlive === 0) {
            await _handleWWWin(sock, msg, from, ww, 'villager', dbs, saveDb, noyaFooter);
            return;
        }
        if (wwAlive >= vilAlive) {
            await _handleWWWin(sock, msg, from, ww, 'werewolf', dbs, saveDb, noyaFooter);
            return;
        }

        ww.phase = 'day';
        ww.round = (ww.round || 1) + 1;
        ww.votes = {};
        ww.nightActions = {};
        dbs.gameDb[from] = ww;
        await saveDb('gameDb');

        const aliveList = ww.alivePlayers.map((p, i) => '│ ﹒' + (i + 1) + '. @' + p.split('@')[0]).join('\n');
        return await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n' + killMsg + '\n\n╔══════════════════════╗\n║  ☀️ *SIANG - RONDE ' + ww.round + '*  ║\n╚══════════════════════╝\n\n✿ *PEMAIN HIDUP*\n┌─────────────────────\n' + aliveList + '\n└─────────────────────\n\n│ ﹒Diskusi siapa Werewolf-nya!\n│ ﹒*' + prefix + 'wwvote @pemain* untuk voting\n│ ﹒*' + prefix + 'wwend* untuk eksekusi & lanjut malam\n└─────────────────────' + noyaFooter,
            mentions: ww.alivePlayers
        }, { quoted: msg });
    }
};

// ════════════════════════════════════════════════════════
const handleGameAnswer = async function(sock, msg, text, sender, from, dbs) {
    if (!dbs.gameDb) return false;
    const game = dbs.gameDb[from];
    if (!game) return false;

    // Flag
    if (game.type === 'flag') {
        if (Date.now() > game.expiresAt) { delete dbs.gameDb[from]; await saveDb('gameDb'); return false; }
        const guess = text.trim().toLowerCase();
        if (!game.answers.some(a => a === guess || guess.includes(a) || a.includes(guess))) return false;
        const correct = game.answers[0];
        delete dbs.gameDb[from]; await saveDb('gameDb');
        const result   = await awardXp(dbs, saveDb, sender, 20);
        const levelStr = result?.leveledUp ? '\n│ ﹒🎉 *LEVEL UP!* -> Level '+result.newLevel : '';
        if (!dbs.ecoDb) dbs.ecoDb = {};
        if (!dbs.ecoDb[sender]) dbs.ecoDb[sender] = { balance: 0 };
        dbs.ecoDb[sender].balance += WIN_REWARD_TB;
        await saveDb('ecoDb');
        await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *PERFECT!* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *RESULT*\n┌─────────────────────\n│ ﹒✅ Jawaban: *'+correct.toUpperCase()+'*\n│ ﹒🏆 Dijawab oleh: @'+sender.split('@')[0]+'\n│ \n│ ﹒🎁 Reward:\n│ ﹒+ 20 XP\n│ ﹒+ Rp'+WIN_REWARD_TB.toLocaleString('id-ID')+levelStr+'\n└─────────────────────'+noyaFooter,
            mentions: [sender]
        }, { quoted: msg });
        return true;
    }

    // Math
    if (game.type === 'math') {
        if (Date.now() > game.expiresAt) { delete dbs.gameDb[from]; await saveDb('gameDb'); return false; }
        const userAns = parseFloat(text.trim().replace(',', '.'));
        if (isNaN(userAns) || userAns !== game.answer) return false;
        const cfg = MATH_CONFIG[game.level] || MATH_CONFIG.easy;
        delete dbs.gameDb[from]; await saveDb('gameDb');
        const result   = await awardXp(dbs, saveDb, sender, cfg.xp);
        const levelStr = result?.leveledUp ? '\n│ ﹒🎉 *LEVEL UP!* -> Level '+result.newLevel : '';
        if (!dbs.ecoDb) dbs.ecoDb = {};
        if (!dbs.ecoDb[sender]) dbs.ecoDb[sender] = { balance: 0 };
        dbs.ecoDb[sender].balance += cfg.reward;
        await saveDb('ecoDb');
        await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *CORRECT!* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *RESULT*\n┌─────────────────────\n│ ﹒✅ Soal    : *'+game.question+' = '+game.answer+'*\n│ ﹒🏆 Dijawab : @'+sender.split('@')[0]+'\n│ \n│ ﹒🎁 Reward:\n│ ﹒+ '+cfg.xp+' XP\n│ ﹒+ Rp'+cfg.reward.toLocaleString('id-ID')+levelStr+'\n└─────────────────────'+noyaFooter,
            mentions: [sender]
        }, { quoted: msg });
        return true;
    }

    // TTT pending
    if (game.type === 'ttt' && game.status === 'pending') {
        if (sender !== game.opponent) return false;
        const ans = text.trim().toLowerCase();
        if (ans === 'n') {
            delete dbs.gameDb[from]; await saveDb('gameDb');
            await sock.sendMessage(from, { text: '❌ @'+sender.split('@')[0]+' menolak tantangan.', mentions: [sender] }, { quoted: msg });
            return true;
        }
        if (ans === 'y') {
            const playerX = Math.random() < 0.5 ? game.challenger : game.opponent;
            const playerO = playerX === game.challenger ? game.opponent : game.challenger;
            const board   = Array(9).fill(null);
            dbs.gameDb[from] = { type: 'ttt', status: 'playing', board, players: { X: playerX, O: playerO }, currentTurn: 'X', startedAt: Date.now() };
            await saveDb('gameDb');
            await sock.sendMessage(from, {
                text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *TIC TAC TOE* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *MATCH INFO*\n┌─────────────────────\n│ ﹒✖️ : @'+playerX.split('@')[0]+'\n│ ﹒⭕ : @'+playerO.split('@')[0]+'\n└─────────────────────\n\n✿ *BOARD*\n'+renderBoard(board)+'\n\n· · ────────────── · ·\n> _Giliran ✖️ jalan duluan!_\n> _Ketik angka 1-9 untuk jalan_ ✦',
                mentions: [playerX, playerO]
            });
            return true;
        }
        return false;
    }

    // TTT playing
    if (game.type === 'ttt' && game.status === 'playing') {
        const isP = game.players.X === sender || game.players.O === sender;
        if (!isP) return false;
        if (game.players[game.currentTurn] !== sender) return false;
        const move = parseInt(text.trim(), 10);
        if (isNaN(move) || move < 1 || move > 9) return false;
        const idx = move - 1;
        if (game.board[idx] !== null) {
            await sock.sendMessage(from, { text: '⚠️ Kotak itu sudah terisi, pilih kotak lain.' }, { quoted: msg });
            return true;
        }
        game.board[idx] = game.currentTurn;
        const boardStr = renderBoard(game.board);
        const winner   = checkWinner(game.board);
        const draw     = isDraw(game.board);

        if (winner) {
            const winnerJid = game.players[winner];
            const loserJid  = winner === 'X' ? game.players.O : game.players.X;
            delete dbs.gameDb[from]; await saveDb('gameDb');
            if (!dbs.tttStatDb) dbs.tttStatDb = {};
            if (!dbs.tttStatDb[winnerJid]) dbs.tttStatDb[winnerJid] = { wins: 0, losses: 0, draws: 0 };
            if (!dbs.tttStatDb[loserJid])  dbs.tttStatDb[loserJid]  = { wins: 0, losses: 0, draws: 0 };
            dbs.tttStatDb[winnerJid].wins  += 1;
            dbs.tttStatDb[loserJid].losses += 1;
            await saveDb('tttStatDb');
            const xpResult = await awardXp(dbs, saveDb, winnerJid, 30);
            const levelStr = xpResult?.leveledUp ? '\n│ ﹒🎉 *LEVEL UP!* -> Level '+xpResult.newLevel : '';
            if (!dbs.ecoDb) dbs.ecoDb = {};
            if (!dbs.ecoDb[winnerJid]) dbs.ecoDb[winnerJid] = { balance: 0 };
            dbs.ecoDb[winnerJid].balance += WIN_REWARD_TTT;
            await saveDb('ecoDb');
            return await sock.sendMessage(from, {
                text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *TIC TAC TOE* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *FINAL BOARD*\n'+boardStr+'\n\n✿ *RESULT*\n┌─────────────────────\n│ ﹒🏆 WINNER : @'+winnerJid.split('@')[0]+'\n│ \n│ ﹒🎁 Reward:\n│ ﹒+ 30 XP\n│ ﹒+ Rp'+WIN_REWARD_TTT.toLocaleString('id-ID')+levelStr+'\n└─────────────────────'+noyaFooter,
                mentions: [winnerJid, loserJid]
            });
        }

        if (draw) {
            delete dbs.gameDb[from]; await saveDb('gameDb');
            if (!dbs.tttStatDb) dbs.tttStatDb = {};
            for (const sym of ['X','O']) {
                const jid = game.players[sym];
                if (!dbs.tttStatDb[jid]) dbs.tttStatDb[jid] = { wins: 0, losses: 0, draws: 0 };
                dbs.tttStatDb[jid].draws += 1;
            }
            await saveDb('tttStatDb');
            return await sock.sendMessage(from, {
                text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *TIC TAC TOE* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *FINAL BOARD*\n'+boardStr+'\n\n✿ *RESULT*\n┌─────────────────────\n│ ﹒🤝 *PERMAINAN SERI!*\n│ ﹒Tidak ada yang menang.\n└─────────────────────'+noyaFooter,
                mentions: [game.players.X, game.players.O]
            });
        }

        const next = game.currentTurn === 'X' ? 'O' : 'X';
        game.currentTurn = next;
        dbs.gameDb[from] = game;
        await saveDb('gameDb');
        const nextPlayer = game.players[next];
        await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *TIC TAC TOE* 𝜗𝜚˚⋆ ║\n╚══════════════════════╝\n\n✿ *BOARD*\n'+boardStr+'\n\n· · ────────────── · ·\n> _Giliran @'+nextPlayer.split('@')[0]+' ('+TTT_SYMBOLS[next]+')_\n> _Ketik angka 1-9 untuk jalan_ ✦',
            mentions: [nextPlayer]
        });
        return true;
    }

    return false;
};

// ── WW WIN HANDLER ────────────────────────────────────
async function _handleWWWin(sock, msg, from, ww, winner, dbs, saveDb, noyaFooter) {
    if (!dbs.wwStatDb) dbs.wwStatDb = {};
    const roleEmoji = { werewolf: '🐺', seer: '🔮', doctor: '💊', bodyguard: '🛡️', villager: '🏘️' };

    const allRoles = Object.entries(ww.playerRoles).map(([p, r]) => '│ ﹒' + roleEmoji[r] + ' @' + p.split('@')[0] + ' → *' + r.toUpperCase() + '*').join('\n');

    for (const [player, role] of Object.entries(ww.playerRoles)) {
        if (!dbs.wwStatDb[player]) dbs.wwStatDb[player] = { winsWerewolf: 0, winsVillager: 0, losses: 0, gamesPlayed: 0 };
        dbs.wwStatDb[player].gamesPlayed += 1;
        const playerWon = (winner === 'werewolf' && role === 'werewolf') || (winner === 'villager' && role !== 'werewolf');
        if (playerWon) {
            if (role === 'werewolf') dbs.wwStatDb[player].winsWerewolf += 1;
            else dbs.wwStatDb[player].winsVillager += 1;
        } else {
            dbs.wwStatDb[player].losses += 1;
        }
    }
    await saveDb('wwStatDb');
    delete dbs.gameDb[from];
    await saveDb('gameDb');

    const winnerLabel = winner === 'werewolf' ? '🐺 WEREWOLF MENANG!' : '🏘️ WARGA MENANG!';
    const winnerDesc  = winner === 'werewolf' ? 'Para Werewolf berhasil menguasai desa!' : 'Semua Werewolf berhasil ditemukan dan diusir!';

    return await sock.sendMessage(from, {
        text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n╔══════════════════════╗\n║  🏆 *GAME OVER!*      ║\n╚══════════════════════╝\n\n✿ *PEMENANG*\n┌─────────────────────\n│ ﹒' + winnerLabel + '\n│ ﹒' + winnerDesc + '\n└─────────────────────\n\n✿ *SEMUA PERAN*\n┌─────────────────────\n' + allRoles + '\n└─────────────────────' + noyaFooter,
        mentions: ww.players
    }, { quoted: msg });
}

// ── WW NIGHT ACTION HANDLER (DM) ─────────────────────
const handleWWNightAction = async function(sock, msg, text, sender, from, dbs) {
    if (!dbs.gameDb) return false;

    // Find which group this player is in a werewolf night
    let gameGroup = null;
    let ww = null;
    for (const [groupJid, game] of Object.entries(dbs.gameDb)) {
        if (game.type === 'werewolf' && game.phase === 'night' && game.alivePlayers.includes(sender)) {
            gameGroup = groupJid;
            ww = game;
            break;
        }
    }
    if (!gameGroup || !ww) return false;

    const lower = text.trim().toLowerCase();
    const validActions = ['kill', 'check', 'save', 'guard'];
    const action = validActions.find(a => lower.startsWith(a + ' ') || lower === a);
    if (!action) return false;

    const role = ww.playerRoles[sender];
    const allowedActions = {
        werewolf:  ['kill'],
        seer:      ['check'],
        doctor:    ['save'],
        bodyguard: ['guard'],
        villager:  []
    };

    if (!allowedActions[role]?.includes(action)) {
        await sock.sendMessage(from, { text: '⚠️ Aksi *' + action + '* tidak tersedia untuk peranmu (' + role + ').' });
        return true;
    }

    // Extract target from mention or text
    const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let target = mentionedJid[0];

    if (!target) {
        // Try to find by number in text
        const parts = text.trim().split(' ');
        const numPart = parts[1]?.replace(/[^0-9]/g, '');
        if (numPart) target = ww.alivePlayers.find(p => p.includes(numPart));
    }

    if (!target || !ww.alivePlayers.includes(target)) {
        await sock.sendMessage(from, { text: '⚠️ Target tidak ditemukan atau sudah tereliminasi. Gunakan format:\n*' + action + ' @target*' });
        return true;
    }

    if (action === 'kill' && target === sender) {
        await sock.sendMessage(from, { text: '⚠️ Kamu tidak bisa membunuh dirimu sendiri!' });
        return true;
    }

    ww.nightActions[action] = target;
    dbs.gameDb[gameGroup] = ww;
    await saveDb('gameDb');

    const actionLabel = { kill: '🗡️ Membunuh', check: '🔮 Memeriksa', save: '💊 Melindungi', guard: '🛡️ Menjaga' };
    await sock.sendMessage(from, {
        text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *AKSI TERCATAT*\n┌─────────────────────\n│ ﹒' + actionLabel[action] + ' @' + target.split('@')[0] + '\n│ ﹒✅ Aksimu sudah tersimpan!\n└─────────────────────'
    });

    // Special: Seer gets result immediately
    if (action === 'check') {
        const targetRole = ww.playerRoles[target];
        const isWW = targetRole === 'werewolf';
        await sock.sendMessage(from, {
            text: '╔══════════════════════╗\n║ ⋆. 𐙚˚࿔ *WEREWOLF* 𝜗𝜚˚⋆   ║\n╚══════════════════════╝\n\n✿ *HASIL PENGLIHATAN*\n┌─────────────────────\n│ ﹒🔮 @' + target.split('@')[0] + ' adalah...\n│ ﹒' + (isWW ? '🐺 *WEREWOLF!* Dia berbahaya!' : '🕊️ *BUKAN WEREWOLF*') + '\n└─────────────────────'
        });
    }

    return true;
};

module.exports = { gameCmd, handleGameAnswer, handleWWNightAction };