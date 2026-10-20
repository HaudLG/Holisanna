/* Holisanna — espace explorateur : tableau de bord, rendez-vous, avis, favoris, cocktail.
   Chaque page déclare sa section dans <body data-section="dash|rdv|avis|favoris|cocktail|messages|notifs|profil">.
   Données de démonstration stockées dans le navigateur (HOL.Store) : à remplacer par la base. */
(function () {
  'use strict';
  var D = window.HOL_DATA, P = D.PILLARS;
  var section = document.body.getAttribute('data-section');
  var root = document.getElementById('espace-root');
  var modal = '';   // '', 'move' ou 'cancel'

  /* Accès réservé aux explorateurs connectés */
  var sess = HOL.Session.get();
  if (!sess.loggedIn) { location.replace('connexion.html'); return; }
  if (sess.role === 'praticien') { location.replace('espace-praticien.html'); return; }

  /* ----- Données réelles (Supabase) : réservations et praticiens recommandés ----- */
  var rd = { ready: false, err: false, list: [], recos: [] }, cancelId = null;
  function paris(iso) {
    var o = {}; new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)).forEach(function (x) { o[x.type] = x.value; });
    return o;
  }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function whenLong(iso) { var p = paris(iso); return cap(p.weekday) + ' ' + p.day + ' ' + p.month + ' · ' + p.hour + 'h' + p.minute; }
  function upcoming() { var n = Date.now(); return rd.list.filter(function (r) { return r.statut === 'confirmee' && new Date(r.debut).getTime() > n; }).sort(function (a, b) { return new Date(a.debut) - new Date(b.debut); }); }
  function pastList() { var n = Date.now(); return rd.list.filter(function (r) { return !(r.statut === 'confirmee' && new Date(r.debut).getTime() > n); }); }
  /* Séances réalisées = réservations confirmées dont l'heure de fin est passée (ou marquées « honorée ») */
  function realSessions() {
    var n = Date.now();
    return rd.list.filter(function (r) { return r.statut === 'honoree' || (r.statut === 'confirmee' && new Date(r.fin).getTime() <= n); })
      .sort(function (a, b) { return new Date(a.debut) - new Date(b.debut); })
      .map(function (r) {
        var p = paris(r.debut);
        return { discipline: r.discipline_nom || r.prestation_nom, pillar: P[r.pilier] ? r.pilier : 'corps', prat: r.praticien_nom, date: p.day + ' ' + p.month, price: r.prix_annonce + ' €' };
      });
  }
  function loadReal() {
    var c = HOL.sb(); if (!c) { rd.err = true; return Promise.resolve(); }
    return Promise.all([
      c.from('reservations').select('*').order('debut', { ascending: false }).limit(200),
      window.HOL_DIR ? HOL_DIR.list().catch(function () { return []; }) : Promise.resolve([])
    ]).then(function (r) {
      if (r[0].error) throw r[0].error;
      rd.list = r[0].data || []; rd.recos = (r[1] || []).slice(0, 3); rd.ready = true;
    }).catch(function () { rd.err = true; });
  }
  function pendingNote(what) { return '<div class="empty-note">' + (rd.err ? 'Impossible de charger ' + what + ' pour le moment. Rechargez la page dans un instant.' : 'Chargement…') + '</div>'; }

  function st() { return HOL.Store.get(); }
  function save(s) { HOL.Store.set(s); }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ----- Données dérivées ----- */
  function derive() {
    var s = st(), counts = { corps: 0, ame: 0, esprit: 0 };
    if (!s.demoCocktail) { s.sessions = realSessions(); s.reviewed = []; }   /* compte réel : séances réellement passées (sauf « exemple rempli ») */
    s.sessions.forEach(function (x) { counts[x.pillar]++; });
    var hist = s.sessions.slice().reverse().map(function (x, i) {
      var idx = s.sessions.length - 1 - i, pl = P[x.pillar];
      return Object.assign({}, x, {
        idx: idx, initials: D.initials(x.prat), bg: pl.bg, color: pl.color,
        done: s.reviewed.indexOf(idx) !== -1,
        quote: QUOTES[idx % QUOTES.length],
        target: D.PRATS.filter(function (p) { return p.name === x.prat; })[0] || null
      });
    });
    var names = s.sessions.map(function (x) { return x.prat; }).filter(function (n, i, a) { return a.indexOf(n) === i; });
    return {
      s: s, counts: counts, hist: hist,
      toReview: hist.filter(function (h) { return !h.done; }),
      reviewed: hist.filter(function (h) { return h.done; }),
      pratCount: names.length,
      touched: Object.keys(counts).filter(function (k) { return counts[k]; }).length
    };
  }
  var QUOTES = [
    'Une écoute rare. Je suis repartie avec des repères simples, tenables.',
    'Trois séances et le sommeil est revenu. Je ne pensais pas que ce serait si direct.',
    'Un moment suspendu. Le corps se dénoue avant que la tête ne comprenne.'
  ];

  /* ----- Menu latéral ----- */
  var ICO = {
    dash: ['M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z', ''],
    cocktail: ['M4 5h16l-8 8z', 'M12 13v6 M8 19h8'],
    rdv: ['M3 5h18v16H3z', 'M3 10h18 M8 3v4 M16 3v4'],
    avis: ['M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z', ''],
    search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'M21 21l-4.35-4.35'],
    favoris: ['M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.8-8.5 11.3-8.5 11.3z', ''],
    notifs: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'],
    messages: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', ''],
    profil: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z'],
    out: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5 M21 12H9']
  };
  function navItem(label, key, href, badge, extra) {
    var on = section === key;
    var ic = ICO[key] || ICO.out;
    return '<a class="sidenav__item' + (on ? ' is-on' : '') + (extra || '') + '" href="' + href + '"' + (on ? ' aria-current="page"' : '') + '>' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + ic[0] + '"></path><path d="' + ic[1] + '"></path></svg>' +
      '<span>' + label + '</span>' + (badge ? '<span class="badge-n">' + badge + '</span>' : '') + '</a>';
  }
  function sidebar(d) {
    var unreadMsg = 0, unreadNot = 0, nUp = upcoming().length;
    return '<aside class="sidenav">' +
      '<div class="sidenav__group"><div class="sidenav__title">Navigation</div>' +
      navItem('Tableau de bord', 'dash', 'espace.html') + navItem('Mon Cocktail', 'cocktail', 'cocktail.html') +
      navItem('Mes rendez-vous', 'rdv', 'espace-rendez-vous.html', nUp ? String(nUp) : '') +
      navItem('Mes avis', 'avis', 'espace-avis.html', d.toReview.length ? String(d.toReview.length) : '') +
      navItem('Messages', 'messages', 'espace-messages.html', unreadMsg ? String(unreadMsg) : '') +
      navItem('Notifications', 'notifs', 'espace-notifications.html', unreadNot ? String(unreadNot) : '') + '</div>' +
      '<div class="sidenav__group"><div class="sidenav__title">Découvrir</div>' +
      navItem('Rechercher', 'search', 'recherche.html') + navItem('Praticiens favoris', 'favoris', 'espace-favoris.html') + '</div>' +
      '<div class="sidenav__group"><div class="sidenav__title">Compte</div>' +
      navItem('Mon profil', 'profil', 'espace-profil.html') +
      '<button class="sidenav__item sidenav__item--out" type="button" data-act="logout"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + ICO.out[0] + '"></path><path d="' + ICO.out[1] + '"></path></svg><span>Déconnexion</span></button></div>' +
      '<div class="sidenav__user"><div class="sidenav__avatar">' + HOL.esc(HOL.who().initials) + '</div><div><div class="sidenav__name">' + HOL.esc(HOL.who().full) + '</div><div class="sidenav__role">Exploratrice</div></div></div>' +
      '</aside>';
  }

  /* ----- Blocs ----- */
  function banner(d) {
    var date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    date = date.charAt(0).toUpperCase() + date.slice(1);
    var wk = upcoming().filter(function (r) { return new Date(r.debut).getTime() < Date.now() + 7 * 86400000; }).length;
    var rdvTxt = !rd.ready ? 'Bienvenue' : wk ? 'Vous avez ' + wk + ' rendez-vous' : 'Vous n’avez aucun rendez-vous';
    return '<div class="banner"><div class="banner__text"><div class="banner__date">' + date + '</div>' +
      '<h1>Bonjour ' + HOL.esc(HOL.who().first) + ',<br><em>prenez soin de vous.</em></h1>' +
      '<p>' + rdvTxt + ' cette semaine et ' + d.touched + ' piliers dans votre cocktail.</p></div>' +
      '<a class="banner__search" href="recherche.html"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(250,246,238,0.45)" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg><span>Rechercher un praticien…</span></a></div>';
  }
  function stats(d) {
    var items = [
      [d.s.sessions.length, 'Séances totales', ''],
      [d.touched, 'Piliers touchés', ''],
      [d.pratCount, 'Praticiens', ''],
      [d.s.reviewed.length, 'Avis publiés', d.toReview.length ? d.toReview.length + ' en attente' : '']
    ];
    return '<div class="xstats">' + items.map(function (i) {
      return '<div class="xstat"><div class="xstat__n">' + i[0] + '</div><div class="xstat__label">' + i[1] + '</div><div class="xstat__trend">' + i[2] + '</div></div>';
    }).join('') + '</div>';
  }
  function head(title, linkLabel, href) {
    return '<div class="sec-head"><h2>' + title + '</h2>' + (linkLabel ? '<a class="sec-link" href="' + href + '">' + linkLabel + '</a>' : '') + '</div>';
  }
  function ics(r) {
    var f = function (iso) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); };
    var t = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Holisanna//FR', 'BEGIN:VEVENT', 'UID:' + r.id + '@holisanna', 'DTSTAMP:' + f(new Date().toISOString()), 'DTSTART:' + f(r.debut), 'DTEND:' + f(r.fin),
      'SUMMARY:' + r.prestation_nom + ' avec ' + r.praticien_nom, 'LOCATION:' + (r.lieu || ''), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/calendar' })); a.download = 'seance-holisanna.ics'; document.body.appendChild(a); a.click(); a.remove();
  }
  function rdvCard(r) {
    var p = paris(r.debut);
    return '<div class="rdv"><div class="rdv__date"><div class="rdv__day">' + esc(p.day) + '</div><div class="rdv__month">' + esc(cap(p.month)) + '</div></div>' +
      '<div class="rdv__body"><div class="rdv__when">' + esc(cap(p.weekday)) + ' · ' + p.hour + 'h' + p.minute + '</div><div class="rdv__title">' + esc(r.prestation_nom) + ' avec ' + esc(r.praticien_nom) + '</div>' +
      '<div class="rdv__meta">' + esc(r.lieu || '') + (r.lieu ? ' · ' : '') + esc(r.prix_annonce) + ' € sur place</div></div>' +
      '<div class="rdv__actions"><button class="btn-ghost2" type="button" data-act="agenda" data-id="' + r.id + '">Ajouter à l\'agenda</button>' +
      '<div class="rdv__row"><button class="btn-mini btn-mini--no" type="button" data-act="open-cancel" data-id="' + r.id + '">Annuler</button></div></div></div>';
  }
  function nextRdv(d, all) {
    if (!rd.ready) return head('Prochain rendez-vous', 'Voir tous →', 'espace-rendez-vous.html') + pendingNote('vos rendez-vous');
    var up = upcoming();
    if (!up.length) return head('Prochain rendez-vous', 'Voir tous →', 'espace-rendez-vous.html') +
      '<div class="empty-note">Aucun rendez-vous à venir. <a class="sec-link" href="recherche.html">Trouver un praticien →</a></div>';
    return head(all ? 'Rendez-vous à venir' : 'Prochain rendez-vous', 'Voir tous →', 'espace-rendez-vous.html') + (all ? up : up.slice(0, 1)).map(rdvCard).join('');
  }
  function histRow(h, withBtns) {
    return '<div class="hrow"><div class="hrow__avatar" style="background:' + h.bg + ';color:' + h.color + '">' + h.initials + '</div>' +
      '<div class="hrow__body"><div class="hrow__name">' + esc(h.prat) + '</div><div class="hrow__meta" style="color:' + h.color + '">' + esc(h.discipline) + ' · ' + esc(h.date) + '</div></div>' +
      (withBtns ?
        '<div class="hrow__btns"><button class="hbtn hbtn--rev' + (h.done ? ' is-done' : '') + '" type="button" data-act="review" data-idx="' + h.idx + '">' + (h.done ? 'Avis publié' : 'Laisser un avis') + '</button>' +
        '<button class="hbtn" type="button" data-act="rebook-pr" data-idx="' + h.idx + '">Reprendre rendez-vous</button></div>' :
        '<div class="hrow__price">' + esc(h.price) + '</div>') + '</div>';
  }
  function favs() {
    return head('Mes praticiens favoris', 'Voir tous →', 'recherche.html') +
      '<div class="empty-note">Vos praticiens favoris apparaîtront ici. <a class="sec-link" href="recherche.html">Explorer →</a></div>';
    var rows = [1, 6, 9].map(D.findPrat).filter(Boolean);
    return head('Mes praticiens favoris', 'Voir tous →', 'recherche.html') +
      '<div class="favs">' + rows.map(function (p) {
        var pl = P[p.pillar];
        return '<div class="fav"><div class="fav__avatar" style="background:' + pl.bg + ';color:' + pl.color + '">' + D.initials(p.name) + '</div>' +
          '<div class="fav__name">' + p.name + '</div><div class="fav__disc" style="color:' + pl.color + '">' + p.discipline + '</div>' +
          '<a class="btn-rose" href="praticien.html?id=' + p.id + '">Réserver</a></div>';
      }).join('') + '</div>';
  }

  /* ----- Sections ----- */
  function secDash(d) {
    var top = d.hist.slice(0, 3);
    return stats(d) + nextRdv(d) +
      head('Historique des séances', 'Voir tout →', 'espace-rendez-vous.html') +
      '<div class="hlist">' + (top.length ? top.map(function (h) { return histRow(h, true); }).join('') : '<div class="empty-note">Aucune séance pour le moment.</div>') + '</div>' + favs();
  }
  function secRdv(d) {
    var past = pastList();
    return nextRdv(d, true) + head('Séances passées ou annulées') +
      '<div class="hlist" style="margin-bottom:8px">' + (!rd.ready ? pendingNote('vos séances') : past.length ? past.map(function (r) {
        var lbl = { confirmee: 'Séance passée', honoree: 'Séance réalisée', annulee_explorateur: 'Annulée par vous', annulee_praticien: 'Annulée par le praticien', absente: 'Absence' }[r.statut] || '';
        var ini = r.praticien_nom.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
        return '<div class="hrow"><div class="hrow__avatar" style="background:var(--olive-bg);color:var(--olive)">' + esc(ini) + '</div><div class="hrow__body"><div class="hrow__name">' + esc(r.praticien_nom) + '</div><div class="hrow__meta">' + esc(r.prestation_nom) + ' · ' + esc(whenLong(r.debut)) + ' · ' + lbl + '</div></div><div class="hrow__price">' + esc(r.prix_annonce) + ' €</div></div>';
      }).join('') : '<div class="empty-note">Aucune séance pour le moment.</div>') + '</div>';
  }
  function secAvis(d) {
    return head('Avis à laisser') + '<div class="hlist" style="margin-bottom:32px">' +
      (d.toReview.length ? d.toReview.map(function (h) {
        return '<div class="hrow hrow--lg"><div class="hrow__avatar" style="background:' + h.bg + ';color:' + h.color + '">' + h.initials + '</div>' +
          '<div class="hrow__body"><div class="hrow__name">' + esc(h.prat) + '</div><div class="hrow__meta" style="color:' + h.color + '">' + esc(h.discipline) + ' · ' + esc(h.date) + '</div></div>' +
          (d.s.demoCocktail ? '<button class="btn-rose" type="button" data-act="review" data-idx="' + h.idx + '" style="padding:9px 16px">Laisser un avis</button>' : '<span class="hrow__meta">Avis bientôt disponibles</span>') + '</div>';
      }).join('') : '<div class="empty-note">Vous avez répondu à toutes vos invitations d’avis.</div>') + '</div>' +
      head('Avis publiés') + '<div class="hlist" style="margin-bottom:0">' +
      (d.reviewed.length ? d.reviewed.map(function (h) {
        return '<div class="review-card"><div class="review-card__top"><span class="review-card__stars">★★★★★</span><span class="review-card__who">' + esc(h.prat) + '</span>' +
          '<span class="review-card__meta">' + esc(h.discipline) + ' · ' + esc(h.date) + '</span></div><p>' + h.quote + '</p></div>';
      }).join('') : '<div class="empty-note">Vos avis publiés apparaîtront ici.</div>') + '</div>';
  }
  function secFavoris() { return favs(); }
  function secCocktail(d) {
    var s = d.s;
    if (!s.sessions.length) {
      return '<div class="cocktail-empty"><img src="assets/illustration-cocktail-bien-etre.png" alt=""><h2>Votre verre est encore vide</h2>' +
        '<p>Chaque séance passée ajoute une couche, dans la couleur de son pilier. La première suffit à commencer.</p>' +
        '<div class="btn-row-c"><a class="btn-rose" href="recherche.html">TROUVER UN PRATICIEN</a><button class="btn-ghost2" type="button" data-act="demo">VOIR UN EXEMPLE REMPLI</button></div></div>';
    }
    var total = Math.max(s.sessions.length, 1);
    var layers = s.sessions.slice(-9).map(function (x, i) {
      return '<div class="glass__layer" title="' + esc(x.discipline + ' — ' + x.prat) + '" style="background:' + P[x.pillar].color + ';animation-delay:' + (i * 0.09).toFixed(2) + 's"></div>';
    }).join('');
    var progress = ['corps', 'esprit', 'ame'].map(function (k) {
      return '<div><div class="progress__head"><span class="progress__label" style="color:' + P[k].color + '">' + P[k].label + '</span><span class="progress__count">' + d.counts[k] + '</span></div>' +
        '<div class="progress__bar"><div style="background:' + P[k].color + ';width:' + Math.round(d.counts[k] / total * 100) + '%"></div></div></div>';
    }).join('');
    var rows = s.sessions.slice().reverse().map(function (x) {
      return '<div class="compo"><span class="compo__bar" style="background:' + P[x.pillar].color + '"></span>' +
        '<div class="compo__body"><div class="compo__name">' + esc(x.discipline) + '</div><div class="compo__meta">' + esc(x.prat) + ' · ' + esc(x.date) + '</div></div>' +
        '<span class="compo__pillar" style="color:' + P[x.pillar].color + '">' + P[x.pillar].label + '</span><span class="compo__price">' + esc(x.price) + '</span></div>';
    }).join('');
    var missing = ['corps', 'esprit', 'ame'].sort(function (a, b) { return d.counts[a] - d.counts[b]; });
    var suggs = missing.slice(0, 3).map(function (k) {
      var pool = D.PRATS.filter(function (p) { return p.pillar === k; }), pl = P[k];
      return '<a class="sugg" href="recherche.html?pilier=' + k + '" style="background:' + pl.bg + ';--c:' + pl.color + '">' +
        '<div class="sugg__pillar" style="color:' + pl.color + '">' + pl.label + '</div>' +
        '<div class="sugg__title">' + pool[0].discipline + ', ' + pool[1].discipline.toLowerCase() + '</div>' +
        '<div class="sugg__detail">' + pool.length + ' praticiens ' + pl.label.toLowerCase() + ' →</div></a>';
    }).join('');
    return '<div class="cocktail-grid"><div class="glass-card"><div class="glass"><div class="glass__bowl">' + layers + '</div>' +
      '<div class="glass__rim"></div><div class="glass__stem"></div><div class="glass__foot"></div></div>' +
      '<div><div class="glass-count">' + s.sessions.length + ' couches</div><div class="glass-sub">' + d.counts.corps + ' Corps · ' + d.counts.esprit + ' Esprit · ' + d.counts.ame + ' Âme</div></div>' +
      '<div class="btn-row-c"><button class="btn btn-outline" type="button" data-act="save">Sauvegarder</button><button class="btn btn-primary" type="button" data-act="share">Partager</button></div>' +
      '<div class="progress">' + progress + '</div></div>' +
      '<div class="cocktail-side"><div class="panel2"><div class="panel2__head"><div class="panel2__title">Composition</div><div class="panel2__count">' + s.sessions.length + ' séances réalisées</div></div>' + rows + '</div>' +
      '<div class="panel2"><div class="panel2__title" style="margin-bottom:6px">Compléter le cocktail</div><p class="panel2__lead" style="margin-top:0">Chaque pilier propose les disciplines que vous n\'avez pas encore goûtées.</p><div class="suggs">' + suggs + '</div></div></div></div>';
  }


  /* ----- Colonne de droite (toutes les pages de l'espace) ----- */
  var ASIDE_NOTIFS = [
    { title: 'Rappel séance', text: '— Mercredi 9 septembre à 14h avec Naïma Belkacem', time: 'Il y a 2 h', dot: 'var(--rose)' },
    { title: 'Nouveau praticien', text: '— Sofia Nardi (Sophrologie) correspond à votre cocktail', time: 'Hier', dot: 'var(--rose)' },
    { title: 'Avis publié', text: '— votre avis sur Yann Le Guen est en ligne', time: 'Il y a 3 jours', dot: 'var(--border)' }
  ];
  function aside(d) {
    var s = d.s;
    var layers = s.sessions.slice(-9).map(function (x, i) {
      return '<div class="glass__layer glass__layer--s" title="' + esc(x.discipline + ' — ' + x.prat) + '" style="background:' + P[x.pillar].color + ';animation-delay:' + (i * 0.09).toFixed(2) + 's"></div>';
    }).join('');
    var tags = s.sessions.slice(-3).map(function (x) {
      return '<span class="mini-tag" style="background:' + P[x.pillar].bg + ';color:' + P[x.pillar].color + ';border-color:' + P[x.pillar].color + '">' + esc(x.discipline) + '</span>';
    }).join('');
    var recos = rd.recos.map(function (p) {
      var pl = P[p.pillar];
      return '<a class="reco" href="praticien.html?p=' + encodeURIComponent(p.id) + '"><div class="reco__avatar" style="background:' + pl.bg + ';color:' + pl.color + '">' + esc(D.initials(p.name)) + '</div>' +
        '<div style="min-width:0"><div class="reco__name">' + esc(p.name) + '</div><div class="reco__disc" style="color:' + pl.color + '">' + esc(p.discipline) + '</div>' +
        '<div class="reco__meta">' + (p.price != null ? 'dès ' + p.price + ' €' : '') + '</div></div><span class="reco__go">→</span></a>';
    }).join('') || '<div class="today-sub" style="margin-top:0">Les praticiens arrivent bientôt.</div>';
    return '<aside class="rside"><div class="rside__block"><div class="rside__title">Mon Cocktail</div>' +
      '<div class="rside__sub">' + d.counts.corps + ' Corps · ' + d.counts.esprit + ' Esprit · ' + d.counts.ame + ' Âme</div>' +
      '<div class="glass glass--s"><div class="glass__bowl">' + layers + '</div><div class="glass__rim"></div><div class="glass__stem"></div><div class="glass__foot"></div></div>' +
      '<div class="mini-tags">' + tags + '</div><a class="btn-dark2" href="cocktail.html">Composer mon cocktail →</a></div>' +
      '<div class="rside__block"><div class="rside__row"><span class="rside__label">Notifications</span><a class="rside__more" href="espace-notifications.html">Tout voir</a></div>' +
      '<div class="today-sub" style="margin-top:6px">Rien de nouveau pour le moment.</div></div>' +
      '<div><div class="rside__label" style="display:block;margin-bottom:12px">Praticiens recommandés</div>' + recos + '</div></aside>';
  }

  /* ----- Messages ----- */
  var convId = Number(new URLSearchParams(location.search).get('c')) || 1;
  var draft = '';
  function convMessages(c, s) { return (c.messages || []).concat(s.sentMsgs['e' + c.id] || []); }
  function secMessages() {
    return '<div class="sec-head"><h2>Messages</h2></div><div class="empty-note">Aucun message pour le moment. La messagerie avec les praticiens sera activée prochainement.</div>';
  }
  function secMessagesDemo(d) {
    var s = d.s, convs = D.EXPL_CONVOS;
    var active = convs.filter(function (c) { return c.id === convId; })[0] || convs[0];
    var list = convs.map(function (c) {
      var msgs = convMessages(c, s), last = msgs[msgs.length - 1];
      var unread = c.unread && s.readConvs.indexOf('e' + c.id) === -1;
      return '<button class="conv' + (c.id === active.id ? ' is-on' : '') + (unread ? ' is-unread' : '') + '" type="button" data-act="conv" data-id="' + c.id + '">' +
        '<div class="conv__avatar">' + c.initials + '</div><div style="min-width:0;flex:1"><div class="conv__top"><span class="conv__name">' + c.name + '</span><span class="conv__dot"></span><span class="conv__time">' + esc(last.time) + '</span></div>' +
        '<div class="conv__last">' + esc(last.text) + '</div></div></button>';
    }).join('');
    var thread = convMessages(active, s).map(function (m) {
      return '<div class="bubble-m bubble-m--' + (m.from === 'me' ? 'me' : 'them') + '"><div class="bubble-m__t">' + esc(m.text) + '</div><div class="bubble-m__time">' + esc(m.time) + '</div></div>';
    }).join('');
    return '<div class="sec-head"><h2>Messages</h2></div><div class="msgs"><div class="msgs__list">' + list + '</div>' +
      '<div class="msgs__thread"><div class="msgs__head"><div class="conv__avatar conv__avatar--on">' + active.initials + '</div><div style="min-width:0"><div class="msgs__name">' + active.name + '</div><div class="msgs__meta">' + active.meta + '</div></div></div>' +
      '<div class="msgs__body" id="thread">' + thread + '</div>' +
      '<div class="msgs__compose"><input id="draft" value="' + esc(draft) + '" placeholder="Écrire un message…" autocomplete="off"><button class="btn-dark2 btn-dark2--s" type="button" data-act="send">ENVOYER</button></div></div></div>';
  }

  /* ----- Notifications ----- */
  var notifFilter = 'all';
  var FILTERS = [['all', 'Tout'], ['rdv', 'Rendez-vous'], ['avis', 'Avis'], ['reco', 'Recommandations'], ['compte', 'Compte']];
  function secNotifs() {
    return '<div class="sec-head"><h2>Notifications</h2></div><div class="empty-note">Rien de nouveau pour le moment.</div>';
  }
  function secNotifsDemo(d) {
    var s = d.s, shown = D.EXPL_NOTIFS.filter(function (n) { return notifFilter === 'all' || n.type === notifFilter; });
    var groups = [];
    shown.forEach(function (n) {
      var g = groups.filter(function (x) { return x.day === n.day; })[0];
      if (g) g.items.push(n); else groups.push({ day: n.day, items: [n] });
    });
    return '<div class="sec-head" style="flex-wrap:wrap"><h2>Notifications</h2><button class="sec-link" type="button" data-act="read-all">Tout marquer comme lu</button></div>' +
      '<div class="nfilters">' + FILTERS.map(function (f) { return '<button class="nfilter' + (notifFilter === f[0] ? ' is-on' : '') + '" type="button" data-act="filter" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>' +
      groups.map(function (g) {
        return '<div class="ngroup"><div class="ngroup__day">' + g.day + '</div><div class="ngroup__list">' + g.items.map(function (n) {
          var unread = s.notifRead.indexOf(n.id) === -1, col = D.NOTIF_ACCENT[n.type];
          return '<button class="notif' + (unread ? ' is-unread' : '') + '" type="button" data-act="notif" data-id="' + n.id + '" style="border-left-color:' + col + '">' +
            '<span class="notif__dot" style="background:' + (unread ? col : 'var(--border)') + '"></span><div class="notif__body"><div class="notif__title">' + n.title + '</div><div class="notif__text">' + n.text + '</div></div><span class="notif__time">' + n.time + '</span></button>';
        }).join('') + '</div></div>';
      }).join('') +
      (shown.length ? '' : '<div class="empty-note">Aucune notification dans cette catégorie.</div>');
  }

  /* ----- Mon profil ----- */
  var profile = null, prefs = null;
  var FIELDS = [['nom', 'Nom', 'text'], ['email', 'Email', 'email'], ['tel', 'Téléphone', 'text'], ['naissance', 'Date de naissance', 'text'], ['ville', 'Ville', 'text']];
  var PREF_OPTS = ['Corps', 'Âme', 'Esprit', 'Séances en cabinet', 'Séances en visio', 'À domicile', 'Français', 'Anglais', 'Budget ≤ 90 €'];
  function secProfil(d) {
    if (!profile) { profile = Object.assign({}, d.s.explProfile); prefs = d.s.explPrefs.slice(); }
    return '<div class="sec-head"><h2>Mon profil</h2></div>' +
      '<div class="pbox pbox--grid">' + FIELDS.map(function (f) {
        return '<div class="pfield"><label for="f-' + f[0] + '">' + f[1] + '</label><input id="f-' + f[0] + '" data-field="' + f[0] + '" type="' + f[2] + '" value="' + esc(profile[f[0]]) + '"></div>';
      }).join('') + '</div>' +
      '<div class="pbox" style="margin-bottom:20px"><div class="pbox__title">Préférences bien-être</div><p class="pbox__lead">Ces choix orientent les praticiens qui vous sont recommandés.</p><div class="chipset">' +
      PREF_OPTS.map(function (o) { var on = prefs.indexOf(o) !== -1; return '<button class="chipbtn chipbtn--s' + (on ? ' is-on' : '') + '" type="button" data-act="pref" data-v="' + esc(o) + '" aria-pressed="' + on + '">' + o + '</button>'; }).join('') + '</div></div>' +
      '<button class="btn-dark2 btn-dark2--l" type="button" data-act="save-profile">ENREGISTRER MON PROFIL</button>';
  }

  /* ----- Fenêtres modales ----- */
  var MOVE_SLOTS = [
    { day: '10', month: 'Septembre', when: 'Jeudi · 10h30 — 12h00' }, { day: '11', month: 'Septembre', when: 'Vendredi · 14h00 — 15h30' },
    { day: '15', month: 'Septembre', when: 'Mardi · 09h00 — 10h30' }, { day: '16', month: 'Septembre', when: 'Mercredi · 17h00 — 18h30' }
  ];
  function modalHtml() {
    if (modal !== 'cancel') return '';
    var r = rd.list.filter(function (x) { return x.id === cancelId; })[0]; if (!r) return '';
    var free = Date.now() <= new Date(r.annulable_jusqu_au).getTime();
    return '<div class="modal-back" data-act="close-bg"><div class="modal" role="dialog" aria-modal="true">' +
      '<div class="modal__k" style="color:var(--rose)">Annuler la séance</div><h3>Annuler ce rendez-vous ?</h3>' +
      '<p class="modal__lead" style="margin-bottom:18px">' + esc(r.prestation_nom) + ' avec ' + esc(r.praticien_nom) + ', ' + esc(whenLong(r.debut)) + '. ' +
      (free ? 'Nous sommes à plus de 24 heures du rendez-vous : l\'annulation est gratuite et le créneau sera rouvert.' : 'Nous sommes à moins de 24 heures du rendez-vous : l\'annulation en ligne n\'est plus possible. Contactez directement le praticien.') + '</p>' +
      '<div class="modal__btns">' + (free ? '<button class="btn-rose" type="button" data-act="cancel" data-id="' + r.id + '">CONFIRMER L\'ANNULATION</button>' : '') + '<button class="btn-ghost2" type="button" data-act="close">GARDER LE RENDEZ-VOUS</button></div></div></div>';
  }

  /* ----- Rendu ----- */
  function render() {
    var d = derive();
    var content = { dash: secDash, rdv: secRdv, avis: secAvis, favoris: secFavoris, cocktail: secCocktail, messages: secMessages, notifs: secNotifs, profil: secProfil }[section](d);
    root.innerHTML = sidebar(d) + '<div class="espace__main">' + banner(d) + content + '</div>' + aside(d) + modalHtml();
    var th = document.getElementById('thread'); if (th) th.scrollTop = th.scrollHeight;
  }

  /* ----- Actions ----- */
  var ACTIONS = {
    logout: function () { HOL.Session.logout().then(function () { HOL.flash('Vous êtes déconnectée. À bientôt.'); location.href = 'index.html'; }); },
    agenda: function (el) { var r = rd.list.filter(function (x) { return x.id === el.dataset.id; })[0]; if (r) { ics(r); HOL.toast('Fichier calendrier téléchargé : ouvrez-le pour ajouter la séance à votre agenda.'); } },
    'open-cancel': function (el) { cancelId = el.dataset.id; modal = 'cancel'; render(); },
    close: function () { modal = ''; render(); },
    cancel: function (el) {
      HOL.sb().rpc('annuler_reservation', { p_id: el.dataset.id }).then(function (r) {
        if (r.error) throw r.error; return loadReal();
      }).then(function () { modal = ''; render(); HOL.toast('Séance annulée. Aucun frais : le créneau est rouvert.'); })
        .catch(function (e) { modal = ''; render(); HOL.toast(e && e.code === 'P0001' ? e.message : 'Annulation impossible pour le moment.'); });
    },
    review: function (el) {
      var idx = Number(el.dataset.idx), s = st(), h = s.sessions[idx];
      if (s.reviewed.indexOf(idx) !== -1) { HOL.toast('Votre avis sur ' + h.prat + ' est déjà en ligne.'); return; }
      s.reviewed.push(idx); save(s); render();
      HOL.toast('Merci. Votre avis sur ' + h.prat + ' est publié.');
    },
    'rebook-pr': function (el) {
      var h = st().sessions[Number(el.dataset.idx)];
      var p = D.PRATS.filter(function (x) { return x.name === h.prat; })[0];
      if (!p) { HOL.toast('Ce praticien n’a plus de fiche active.'); return; }
      location.href = 'praticien.html?id=' + p.id;
    },
    demo: function () { var s = st(); s.demoCocktail = true; s.sessions = JSON.parse(JSON.stringify(D.DEMO_SESSIONS)); save(s); render(); HOL.toast('Exemple de démonstration chargé (fictif).'); },
    save: function () { HOL.toast('Cocktail sauvegardé sur votre profil explorateur.'); },
    share: function () { HOL.toast('Lien de partage copié : holisanna.fr/cocktail/sarah-n'); },
    conv: function (el) {
      var s = st(), id = Number(el.dataset.id), key = 'e' + id;
      if (s.readConvs.indexOf(key) === -1) { s.readConvs.push(key); save(s); }
      convId = id; draft = ''; history.replaceState(null, '', location.pathname + '?c=' + id); render();
    },
    send: function () {
      var input = document.getElementById('draft'), text = (input ? input.value : draft).trim();
      if (!text) return;
      var s = st(), key = 'e' + convId; s.sentMsgs[key] = (s.sentMsgs[key] || []).concat([{ from: 'me', text: text, time: 'À l’instant' }]);
      save(s); draft = ''; render(); var i = document.getElementById('draft'); if (i) i.focus();
    },
    filter: function (el) { notifFilter = el.dataset.f; render(); },
    'read-all': function () { var s = st(); s.notifRead = D.EXPL_NOTIFS.map(function (n) { return n.id; }); save(s); render(); HOL.toast('Toutes vos notifications sont marquées comme lues.'); },
    notif: function (el) {
      var s = st(), n = D.EXPL_NOTIFS.filter(function (x) { return x.id === el.dataset.id; })[0];
      if (s.notifRead.indexOf(n.id) === -1) { s.notifRead.push(n.id); save(s); }
      location.href = n.go;
    },
    pref: function (el) { var v = el.dataset.v, i = prefs.indexOf(v); if (i > -1) prefs.splice(i, 1); else prefs.push(v); render(); },
    'save-profile': function () { var s = st(); s.explProfile = Object.assign({}, profile); s.explPrefs = prefs.slice(); save(s); HOL.toast('Profil enregistré.'); }
  };

  document.addEventListener('DOMContentLoaded', function () {
    root.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]'); if (!el) return;
      if (el.dataset.act === 'close-bg' && e.target !== el) return;   // clic sur le fond seulement
      var fn = ACTIONS[el.dataset.act === 'close-bg' ? 'close' : el.dataset.act]; if (fn) fn(el);
    });
    root.addEventListener('input', function (e) {
      if (e.target.id === 'draft') draft = e.target.value;
      else if (e.target.dataset.field) profile[e.target.dataset.field] = e.target.value;
    });
    root.addEventListener('keydown', function (e) {
      if (e.target.id === 'draft' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ACTIONS.send(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal) ACTIONS.close(); });
    render();
    loadReal().then(render);
  });
})();
