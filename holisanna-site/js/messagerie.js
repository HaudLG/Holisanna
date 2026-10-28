/* Holisanna — messagerie et notifications réelles (Supabase), partagées par l'espace explorateur et l'espace praticien.
   Usage : var M = HOL_MSG.create({ role: 'explorateur' | 'praticien', rerender: fn });
   Les pages appellent M.load(), M.messagesHtml(), M.notifsHtml(), M.asideHtml(), M.act(nom, élément), M.beforeRender(), M.afterRender(). */
(function () {
  'use strict';
  var TZ = 'Europe/Paris';
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function initials(n) { return String(n || '?').split(/\s+/).map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase(); }
  function parts(iso, opt) { var o = {}; new Intl.DateTimeFormat('fr-FR', Object.assign({ timeZone: TZ, hourCycle: 'h23' }, opt)).formatToParts(new Date(iso)).forEach(function (p) { o[p.type] = p.value; }); return o; }
  function dayKey(iso) { var p = parts(iso, { year: 'numeric', month: '2-digit', day: '2-digit' }); return p.year + '-' + p.month + '-' + p.day; }
  function hm(iso) { var p = parts(iso, { hour: '2-digit', minute: '2-digit' }); return p.hour + ':' + p.minute; }
  function shortWhen(iso) {
    var now = new Date().toISOString();
    if (dayKey(iso) === dayKey(now)) return hm(iso);
    var p = parts(iso, { day: 'numeric', month: 'short' }); return p.day + ' ' + p.month;
  }
  function longWhen(iso) {
    if (dayKey(iso) === dayKey(new Date().toISOString())) return 'Aujourd’hui · ' + hm(iso);
    var p = parts(iso, { weekday: 'short', day: 'numeric', month: 'short' }); return p.weekday + ' ' + p.day + ' ' + p.month + ' · ' + hm(iso);
  }
  function dayLabel(iso) {
    var now = Date.now(), k = dayKey(iso);
    if (k === dayKey(new Date(now).toISOString())) return 'Aujourd’hui';
    if (k === dayKey(new Date(now - 86400000).toISOString())) return 'Hier';
    var p = parts(iso, { weekday: 'long', day: 'numeric', month: 'long' }); return p.weekday.charAt(0).toUpperCase() + p.weekday.slice(1) + ' ' + p.day + ' ' + p.month;
  }
  function ago(iso) {
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 90) return 'À l’instant';
    if (s < 3600) return 'Il y a ' + Math.round(s / 60) + ' min';
    if (s < 86400) return 'Il y a ' + Math.round(s / 3600) + ' h';
    if (s < 86400 * 7) { var d = Math.round(s / 86400); return 'Il y a ' + d + ' jour' + (d > 1 ? 's' : ''); }
    return shortWhen(iso);
  }
  var ACCENT = { resa: 'var(--rose)', msg: 'var(--rose)', avis: 'var(--gold)', reco: 'var(--olive)', fiche: 'var(--olive)', compte: 'var(--slate-lt)', fact: 'var(--slate-lt)' };
  var FILTERS = {
    explorateur: [['all', 'Tout'], ['resa', 'Rendez-vous'], ['msg', 'Messages'], ['avis', 'Avis']],
    praticien: [['all', 'Tout'], ['resa', 'Réservations'], ['msg', 'Messages'], ['avis', 'Avis']]
  };

  function create(cfg) {
    var role = cfg.role, isExpl = role === 'explorateur', rerender = cfg.rerender;
    var qs = new URLSearchParams(location.search);
    var S = {
      ready: false, err: false, convs: [], msgs: [], notifs: [],
      active: qs.get('c') || null, toId: isExpl ? (qs.get('to') || null) : null, toName: '', toPhoto: '',
      draft: '', filter: 'all', sending: false, sig: '', focusDraft: false, marking: false
    };

    function otherId(c) { return isExpl ? c.praticien_id : c.explorateur_id; }
    function otherName(c) { return (isExpl ? c.praticien_nom : c.explorateur_nom) || (isExpl ? 'Praticien' : 'Explorateur'); }
    function msgsOf(c) { return S.msgs.filter(function (m) { return m.conversation_id === c.id; }); }
    function unreadOf(c) { return msgsOf(c).filter(function (m) { return m.auteur_id === otherId(c) && !m.lu_le; }).length; }
    function unreadMsgs() { return S.convs.reduce(function (t, c) { return t + unreadOf(c); }, 0); }
    function unreadNotifs() { return S.notifs.filter(function (n) { return !n.lu_le; }).length; }
    function signature() { return S.msgs.length + '|' + S.notifs.length + '|' + unreadMsgs() + '|' + unreadNotifs() + '|' + S.convs.length; }

    function load() {
      var c = HOL.sb(); if (!c) { S.err = true; return Promise.resolve(); }
      return Promise.all([
        c.from('conversations').select('*').order('dernier_message_le', { ascending: false }).limit(100),
        c.from('messages').select('*').order('envoye_le', { ascending: true }).limit(2000),
        c.from('notifications').select('*').order('cree_le', { ascending: false }).limit(100)
      ]).then(function (r) {
        if (r[0].error) throw r[0].error;
        function arr(x) { return Array.isArray(x.data) ? x.data : []; }
        S.convs = arr(r[0]); S.msgs = r[1].error ? [] : arr(r[1]); S.notifs = r[2].error ? [] : arr(r[2]);
        S.ready = true; S.err = false;
        /* Nouveau message depuis une fiche : retrouver le nom du praticien */
        if (isExpl && S.toId && !S.toName && !S.convs.some(function (x) { return x.praticien_id === S.toId; }) && window.HOL_DIR) {
          return HOL_DIR.byUids([S.toId]).then(function (a) { if (a[0]) { S.toName = a[0].name; S.toPhoto = a[0].photo || ''; } else S.toId = null; }).catch(function () { S.toId = null; });
        }
      }).catch(function () { if (!S.ready) S.err = true; });
    }

    /* Liste des conversations, avec une conversation « à créer » si on arrive depuis une fiche */
    function list() {
      var l = S.convs.slice();
      if (isExpl && S.toId && S.toName && !l.some(function (c) { return c.praticien_id === S.toId; })) {
        l.unshift({ id: null, praticien_id: S.toId, praticien_nom: S.toName, dernier_message_le: new Date().toISOString(), virtual: true });
      }
      return l;
    }
    function activeConv(l) {
      var a = null;
      if (isExpl && S.toId) a = l.filter(function (c) { return c.praticien_id === S.toId; })[0];
      if (!a && S.active) a = l.filter(function (c) { return c.id === S.active; })[0];
      return a || l[0] || null;
    }

    function pendingNote(what) { return '<div class="empty-note">' + (S.err ? 'Impossible de charger ' + what + ' pour le moment. Rechargez la page dans un instant.' : 'Chargement…') + '</div>'; }

    function messagesHtml() {
      if (!S.ready) return '<div class="sec-head"><h2>Messages</h2></div>' + pendingNote('vos messages');
      var l = list();
      if (!l.length) {
        return '<div class="sec-head"><h2>Messages</h2></div><div class="empty-note">Aucun message pour le moment. ' +
          (isExpl ? 'Pour écrire à un praticien, ouvrez sa fiche et cliquez sur « Écrire à… ».' : 'Les explorateurs peuvent vous écrire depuis votre fiche publique : leurs messages apparaîtront ici.') + '</div>';
      }
      var act = activeConv(l);
      var rows = l.map(function (c) {
        var ms = c.id ? msgsOf(c) : [], last = ms[ms.length - 1], un = c.id ? unreadOf(c) : 0;
        return '<button class="conv' + (c === act ? ' is-on' : '') + (un ? ' is-unread' : '') + '" type="button" data-act="conv" data-id="' + esc(c.id || '') + '" data-other="' + esc(otherId(c)) + '">' +
          '<div class="conv__avatar">' + esc(initials(otherName(c))) + '</div><div style="min-width:0;flex:1"><div class="conv__top"><span class="conv__name">' + esc(otherName(c)) + '</span><span class="conv__dot"></span><span class="conv__time">' + (last ? esc(shortWhen(last.envoye_le)) : '') + '</span></div>' +
          '<div class="conv__last">' + (last ? (last.auteur_id !== otherId(c) ? 'Vous : ' : '') + esc(last.texte) : 'Nouveau message') + '</div></div></button>';
      }).join('');
      var thread = '', ms = act.id ? msgsOf(act) : [];
      if (!ms.length) thread = '<div class="empty-note" style="margin:auto;text-align:center;background:none;border:none">' + (act.virtual ? 'Écrivez votre premier message à ' + esc(otherName(act)) + '. Évitez d’y partager des informations de santé : réservez plutôt une séance pour en parler.' : 'Aucun message.') + '</div>';
      else {
        var lastDay = '';
        thread = ms.map(function (m) {
          var mine = m.auteur_id !== otherId(act);
          return '<div class="bubble-m bubble-m--' + (mine ? 'me' : 'them') + '"><div class="bubble-m__t" style="white-space:pre-wrap;overflow-wrap:anywhere">' + esc(m.texte) + '</div><div class="bubble-m__time">' + esc(longWhen(m.envoye_le)) + (mine && m.lu_le ? ' · lu' : '') + '</div></div>';
        }).join('');
      }
      return '<div class="sec-head"><h2>Messages</h2></div><div class="msgs"><div class="msgs__list">' + rows + '</div>' +
        '<div class="msgs__thread"><div class="msgs__head"><div class="conv__avatar conv__avatar--on">' + esc(initials(otherName(act))) + '</div><div style="min-width:0"><div class="msgs__name">' + esc(otherName(act)) + '</div><div class="msgs__meta">' + (isExpl ? 'Praticien' : 'Explorateur') + '</div></div></div>' +
        '<div class="msgs__body" id="thread">' + thread + '</div>' +
        '<div class="msgs__compose"><input id="draft" value="' + esc(S.draft) + '" placeholder="Écrire un message…" maxlength="2000" autocomplete="off"><button class="btn-dark2 btn-dark2--s" type="button" data-act="send"' + (S.sending ? ' disabled' : '') + '>ENVOYER</button></div></div></div>';
    }

    function notifsHtml() {
      if (!S.ready) return '<div class="sec-head"><h2>Notifications</h2></div>' + pendingNote('vos notifications');
      var shown = S.notifs.filter(function (n) { return S.filter === 'all' || n.type === S.filter; }), groups = [];
      shown.forEach(function (n) { var d = dayLabel(n.cree_le), g = groups.filter(function (x) { return x.day === d; })[0]; if (g) g.items.push(n); else groups.push({ day: d, items: [n] }); });
      return '<div class="sec-head" style="flex-wrap:wrap"><h2>Notifications</h2>' + (unreadNotifs() ? '<button class="sec-link" type="button" data-act="read-all">Tout marquer comme lu</button>' : '') + '</div>' +
        '<div class="nfilters">' + FILTERS[role].map(function (f) { return '<button class="nfilter' + (S.filter === f[0] ? ' is-on' : '') + '" type="button" data-act="filter" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>' +
        groups.map(function (g) {
          return '<div class="ngroup"><div class="ngroup__day">' + esc(g.day) + '</div><div class="ngroup__list">' + g.items.map(function (n) {
            var un = !n.lu_le, col = ACCENT[n.type] || 'var(--slate-lt)';
            return '<button class="notif' + (un ? ' is-unread' : '') + '" type="button" data-act="notif" data-id="' + esc(n.id) + '" style="border-left-color:' + col + '">' +
              '<span class="notif__dot" style="background:' + (un ? col : 'var(--border)') + '"></span><div class="notif__body"><div class="notif__title">' + esc(n.titre) + '</div><div class="notif__text">' + esc(n.texte) + '</div></div><span class="notif__time">' + esc(ago(n.cree_le)) + '</span></button>';
          }).join('') + '</div></div>';
        }).join('') + (shown.length ? '' : '<div class="empty-note">' + (S.notifs.length ? 'Aucune notification dans cette catégorie.' : 'Rien de nouveau pour le moment.') + '</div>');
    }

    function asideHtml(more) {
      var items = S.notifs.slice(0, 3);
      return '<div class="rside__block"><div class="rside__row"><span class="rside__label">Notifications</span><a class="rside__more" href="' + more + '">Tout voir</a></div>' +
        (S.ready && items.length ? items.map(function (n) {
          var un = !n.lu_le, col = ACCENT[n.type] || 'var(--slate-lt)';
          return '<a class="anotif" href="' + esc(more) + '" style="text-decoration:none"><span class="anotif__dot" style="background:' + (un ? col : 'var(--border)') + '"></span><div><div class="anotif__text"><strong>' + esc(n.titre) + '</strong> ' + esc(n.texte) + '</div><div class="anotif__time">' + esc(ago(n.cree_le)) + '</div></div></a>';
        }).join('') : '<div class="today-sub" style="margin-top:6px">' + (S.ready ? 'Rien de nouveau pour le moment.' : 'Chargement…') + '</div>') + '</div>';
    }

    /* ----- Actions ----- */
    function markNotifs(ids) {
      var c = HOL.sb(), now = new Date().toISOString();
      S.notifs.forEach(function (n) { if (!n.lu_le && (!ids || ids.indexOf(n.id) !== -1)) n.lu_le = now; });
      if (c) return c.rpc('marquer_notifications_lues', { p_ids: ids || null }).then(function () {}, function () {});
      return Promise.resolve();
    }
    function markRead() {
      if (S.marking || !S.ready || cfg.section !== 'messages') return;
      var act = activeConv(list()); if (!act || !act.id || !unreadOf(act)) return;
      var c = HOL.sb(); if (!c) return;
      S.marking = true;
      var now = new Date().toISOString();
      msgsOf(act).forEach(function (m) { if (m.auteur_id === otherId(act) && !m.lu_le) m.lu_le = now; });
      /* Les notifications de message de cette conversation sont aussi lues */
      var nid = S.notifs.filter(function (n) { return n.type === 'msg' && !n.lu_le && /[?&]c=/.test(n.lien || '') && (n.lien || '').indexOf(act.id) !== -1; }).map(function (n) { return n.id; });
      if (nid.length) markNotifs(nid);
      c.rpc('marquer_messages_lus', { p_conversation: act.id }).then(function () {}, function () {}).then(function () { S.marking = false; S.sig = signature(); rerender(); });
    }
    function send() {
      var input = document.getElementById('draft'), text = (input ? input.value : S.draft).trim();
      if (!text || S.sending) return;
      var act = activeConv(list()); if (!act) return;
      var c = HOL.sb(); if (!c) return;
      S.draft = text; S.sending = true; rerender();
      c.rpc('envoyer_message', { p_destinataire: otherId(act), p_texte: text }).then(function (r) {
        if (r.error) throw r.error;
        S.active = r.data; S.toId = null; S.draft = ''; return load();
      }).then(function () { S.sending = false; S.focusDraft = true; S.sig = signature(); rerender(); })
        .catch(function (e) { S.sending = false; rerender(); HOL.toast(e && e.code === 'P0001' ? e.message : 'Envoi impossible pour le moment. Réessayez dans un instant.'); });
    }
    function handle(name, el) {
      if (name === 'conv') {
        S.active = el.dataset.id || null; if (isExpl) S.toId = el.dataset.id ? null : (el.dataset.other || null); S.draft = '';
        try { history.replaceState(null, '', location.pathname + (el.dataset.id ? '?c=' + el.dataset.id : '')); } catch (e) {}
        rerender(); return true;
      }
      if (name === 'send') { send(); return true; }
      if (name === 'filter') { S.filter = el.dataset.f; rerender(); return true; }
      if (name === 'read-all') { markNotifs(null).then(function () { rerender(); HOL.toast('Toutes vos notifications sont marquées comme lues.'); }); return true; }
      if (name === 'notif') {
        var n = S.notifs.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!n) return true;
        markNotifs([n.id]).then(function () { if (n.lien) location.href = n.lien; else rerender(); });
        return true;
      }
      return false;
    }
    function onInput(e) { if (e.target.id === 'draft') { S.draft = e.target.value; return true; } return false; }
    function onKey(e) { if (e.target.id === 'draft' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); return true; } return false; }
    function beforeRender() { S.focusDraft = S.focusDraft || document.activeElement && document.activeElement.id === 'draft'; }
    function afterRender() {
      var th = document.getElementById('thread'); if (th) th.scrollTop = th.scrollHeight;
      var d = document.getElementById('draft'); if (d && S.focusDraft) { d.focus(); try { d.setSelectionRange(d.value.length, d.value.length); } catch (e) {} }
      S.focusDraft = false;
      markRead();
    }
    function poll() {
      setInterval(function () {
        if (document.hidden || S.sending) return;
        load().then(function () { var s = signature(); if (s !== S.sig) { S.sig = s; beforeRender(); rerender(); } });
      }, 20000);
    }

    return { S: S, load: load, unreadMsgs: unreadMsgs, unreadNotifs: unreadNotifs, messagesHtml: messagesHtml, notifsHtml: notifsHtml, asideHtml: asideHtml,
      act: handle, onInput: onInput, onKey: onKey, beforeRender: beforeRender, afterRender: afterRender, poll: poll, sign: function () { S.sig = signature(); } };
  }

  window.HOL_MSG = { create: create };
})();
