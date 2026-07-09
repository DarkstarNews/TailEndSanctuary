/* Tail End Sanctuary — website editor.
   Plain JavaScript, no build step. Talks to the Cloudflare Worker in
   worker/ (URL set in config.js). Every screen asks one question, every
   change ends with one big green button. */

(function () {
  'use strict';

  var app = document.getElementById('app');
  var API = window.EDITOR_API;
  var SITE_URL = 'https://tailendsanctuary.org';

  var token = localStorage.getItem('tes-token') || '';
  var who = localStorage.getItem('tes-who') || '';
  var content = null; // freshest content.json, fetched after login

  // ------------------------------------------------------------------
  // What the editors are allowed to change, in their words.

  var PHOTO_SLOTS = [
    { path: 'site.logo', page: 'Every page', label: 'The Tail End logo', hint: 'Shown at the top and bottom of every page', logo: true },
    { path: 'home.heroImage', page: 'Home', label: 'Big photo at the top' },
    { path: 'home.motivatesImage', page: 'Home', label: 'Photo next to “Seen at last”' },
    { path: 'about.heroImage', page: 'About Us', label: 'Big photo at the top' },
    { path: 'dogsPage.heroImage', page: 'Meet the Dogs', label: 'Big photo at the top' },
    { path: 'getInvolved.heroImage', page: 'Get Involved', label: 'Big photo at the top' },
    { path: 'donate.heroImage', page: 'Donate', label: 'Big photo at the top' }
  ];

  var TEXT_PAGES = [
    { key: 'home', title: 'Home' },
    { key: 'about', title: 'About Us' },
    { key: 'dogsPage', title: 'Meet the Dogs' },
    { key: 'getInvolved', title: 'Get Involved' },
    { key: 'donate', title: 'Donate' }
  ];

  var TEXT_FIELDS = {
    home: [
      { path: 'home.heroHeading', label: 'Big headline at the top' },
      { path: 'home.facts.0.fig', label: 'Fact box 1 — big words' },
      { path: 'home.facts.0.lbl', label: 'Fact box 1 — small words' },
      { path: 'home.facts.1.fig', label: 'Fact box 2 — big words' },
      { path: 'home.facts.1.lbl', label: 'Fact box 2 — small words' },
      { path: 'home.facts.2.fig', label: 'Fact box 3 — big words' },
      { path: 'home.facts.2.lbl', label: 'Fact box 3 — small words' },
      { path: 'home.facts.3.fig', label: 'Fact box 4 — big words' },
      { path: 'home.facts.3.lbl', label: 'Fact box 4 — small words' },
      { path: 'home.missionText', label: 'Our mission sentence', long: true },
      { path: 'home.teddyHeading', label: '“Meet Teddy” section — headline' },
      { path: 'home.teddyPara1', label: '“Meet Teddy” — first paragraph', long: true },
      { path: 'home.teddyPara2', label: '“Meet Teddy” — second paragraph', long: true },
      { path: 'home.teddyPara3', label: '“Meet Teddy” — third paragraph', long: true },
      { path: 'home.teddyButton', label: '“Meet Teddy” — words on the green button' },
      { path: 'home.pullquote', label: 'Quote in the middle of the page' },
      { path: 'home.motivatesHeading', label: '“Seen at last” section — headline' },
      { path: 'home.motivatesPara1', label: '“Seen at last” — first paragraph', long: true },
      { path: 'home.motivatesPara2', label: '“Seen at last” — second paragraph', long: true },
      { path: 'home.bannerHeading', label: 'Green banner at the bottom' }
    ],
    about: [
      { path: 'about.heroHeading', label: 'Big headline at the top' },
      { path: 'about.storyHeading', label: '“Our story” — headline' },
      { path: 'about.storyPara1', label: 'Our story — paragraph 1', long: true },
      { path: 'about.storyPara2', label: 'Our story — paragraph 2', long: true },
      { path: 'about.storySubheading', label: '“One dog led to another” — headline' },
      { path: 'about.storyPara3', label: 'Our story — paragraph 3', long: true },
      { path: 'about.storyPara4', label: 'Our story — paragraph 4', long: true },
      { path: 'about.storyPara5', label: 'Our story — paragraph 5', long: true },
      { path: 'about.storyPara6', label: 'Our story — last paragraph', long: true },
      { path: 'about.pullquote', label: 'Quote in the middle of the page' },
      { path: 'about.foundersHeading', label: '“Our founders” — headline' },
      { path: 'about.foundersText', label: '“Our founders” — small line under the headline' },
      { path: 'about.bannerHeading', label: 'Green banner at the bottom — headline' },
      { path: 'about.bannerText', label: 'Green banner at the bottom — text', long: true }
    ],
    dogsPage: [
      { path: 'dogsPage.heroHeading', label: 'Big headline at the top' },
      { path: 'dogsPage.bannerHeading', label: 'Green banner at the bottom — headline' },
      { path: 'dogsPage.bannerText', label: 'Green banner at the bottom — text', long: true }
    ],
    getInvolved: [
      { path: 'getInvolved.heroHeading', label: 'Big headline at the top' },
      { path: 'getInvolved.card1Title', label: 'Card 1 — title' },
      { path: 'getInvolved.card1Text', label: 'Card 1 — text', long: true },
      { path: 'getInvolved.card2Title', label: 'Card 2 — title' },
      { path: 'getInvolved.card2Text', label: 'Card 2 — text', long: true },
      { path: 'getInvolved.card3Title', label: 'Card 3 — title' },
      { path: 'getInvolved.card3Text', label: 'Card 3 — text', long: true },
      { path: 'getInvolved.card4Title', label: 'Card 4 — title' },
      { path: 'getInvolved.card4Text', label: 'Card 4 — text', long: true },
      { path: 'getInvolved.closingHeading', label: 'Green banner at the bottom — headline' },
      { path: 'getInvolved.closingText', label: 'Green banner at the bottom — text', long: true }
    ],
    donate: [
      { path: 'donate.heroHeading', label: 'Big headline at the top' },
      { path: 'donate.gift1Title', label: '“Where your gift goes” — box 1 title' },
      { path: 'donate.gift1Text', label: '“Where your gift goes” — box 1 text', long: true },
      { path: 'donate.gift2Title', label: '“Where your gift goes” — box 2 title' },
      { path: 'donate.gift2Text', label: '“Where your gift goes” — box 2 text', long: true },
      { path: 'donate.gift3Title', label: '“Where your gift goes” — box 3 title' },
      { path: 'donate.gift3Text', label: '“Where your gift goes” — box 3 text', long: true }
    ]
  };

  // ------------------------------------------------------------------
  // Small helpers

  function h(html) { app.innerHTML = html; window.scrollTo(0, 0); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function el(id) { return document.getElementById(id); }
  function get(path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, content);
  }
  function plain(s) {
    // Strip the few allowed tags for display in "current text" boxes.
    return String(s == null ? '' : s).replace(/<[^>]*>/g, '');
  }
  function imgUrl(src) { return '../' + src; }

  function topbar(backFn) {
    window._back = backFn || null;
    return (
      '<div class="topbar">' +
      (backFn ? '<button class="btn-back" onclick="_back()">Back</button>' : '<span></span>') +
      (who ? '<span class="hello">Signed in as <strong>' + esc(who) + '</strong></span>' : '') +
      '</div>'
    );
  }

  function helpFooter() {
    return '<p class="footer-help">Stuck or unsure? Nothing here can break the website — and Ryan can undo anything. Email <a href="mailto:ryan@darkstarnews.com">Ryan</a> any time.</p>';
  }

  function working(message) {
    h('<div class="working">' + esc(message || 'One moment…') + '</div>');
  }

  function api(path, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    return fetch(API + path, options).then(function (res) {
      if (res.status === 401) { token = ''; localStorage.removeItem('tes-token'); showLogin(); throw new Error('logged-out'); }
      return res.json();
    });
  }

  // ------------------------------------------------------------------
  // Screens: login / who / menu

  function showLogin(message) {
    if (API === 'PASTE-YOUR-WORKER-URL-HERE') {
      h('<div class="center-screen"><span class="emoji">🔧</span><h1>Almost ready</h1>' +
        '<p>The editor hasn’t been connected yet. (Ryan: set the worker URL in editor/config.js — see SETUP.md.)</p></div>');
      return;
    }
    h(
      '<div class="center-screen"><span class="emoji">🐾</span>' +
      '<h1>Tail End Sanctuary</h1>' +
      '<p class="subtitle">Website editing room</p></div>' +
      '<label class="field-label" for="pw">Please type the password</label>' +
      '<input type="password" id="pw" autocomplete="current-password" style="font-size:1.4rem; letter-spacing:2px;">' +
      (message ? '<div class="error-box">' + esc(message) + '</div>' : '') +
      '<button class="btn-primary" id="go">Come on in</button>' +
      helpFooter()
    );
    el('pw').addEventListener('keydown', function (e) { if (e.key === 'Enter') el('go').click(); });
    el('go').onclick = function () {
      var pw = el('pw').value;
      if (!pw.trim()) return;
      working('Checking…');
      fetch(API + '/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.token) {
          token = d.token; localStorage.setItem('tes-token', token);
          showWho();
        } else {
          showLogin('That password isn’t quite right — please try again.');
        }
      }).catch(function () {
        showLogin('We couldn’t reach the editing room. Please check your internet and try again.');
      });
    };
  }

  function showWho() {
    var names = ['Juanita', 'Ronni', 'Jena'];
    h(
      '<h1>Welcome!</h1><p class="subtitle">Who’s making changes today?</p>' +
      names.map(function (n) {
        return '<button class="big-btn" data-name="' + n + '"><span class="icon">👋</span>' + n + '</button>';
      }).join('') +
      '<button class="big-btn" id="someone-else"><span class="icon">✏️</span>Someone else</button>'
    );
    Array.prototype.forEach.call(document.querySelectorAll('[data-name]'), function (b) {
      b.onclick = function () { setWho(b.getAttribute('data-name')); };
    });
    el('someone-else').onclick = function () {
      h(
        '<h1>Hello!</h1>' +
        '<label class="field-label" for="nm">What’s your name?</label><input type="text" id="nm" autocomplete="name">' +
        '<button class="btn-primary" id="go">That’s me</button>'
      );
      el('go').onclick = function () {
        var n = el('nm').value.trim();
        if (n) setWho(n.slice(0, 40));
      };
    };
  }

  function setWho(name) {
    who = name; localStorage.setItem('tes-who', name);
    loadAndShowMenu();
  }

  function loadAndShowMenu() {
    working('Opening the editing room…');
    api('/api/state').then(function (d) {
      content = d.content;
      showMenu();
    }).catch(function (e) {
      if (e.message !== 'logged-out') showError(showLogin, 'We couldn’t open the editing room. Please try again in a minute.');
    });
  }

  function showMenu() {
    h(
      topbar(null) +
      '<h1>What would you like to do?</h1><p class="subtitle">Pick one — you can always come back here.</p>' +
      '<button class="big-btn" id="m-photos"><span class="icon">📷</span>Change a photo<span class="hint"></span></button>' +
      '<button class="big-btn" id="m-words"><span class="icon">✏️</span>Change some words</button>' +
      '<button class="big-btn" id="m-dogs"><span class="icon">🐕</span>The dogs<span class="hint">Add a dog, update a photo or story</span></button>' +
      '<button class="big-btn" id="m-founders"><span class="icon">💚</span>The founders<span class="hint">Your photos and bios on the About page</span></button>' +
      '<button class="big-btn" id="m-undo"><span class="icon">↩️</span>Undo my last change</button>' +
      '<div style="text-align:center; margin-top:26px;">' +
      '<a href="' + SITE_URL + '" style="color:var(--sage); font-weight:600;">See the website</a>' +
      ' &nbsp;·&nbsp; <button class="small-link" id="signout">Sign out</button></div>' +
      helpFooter()
    );
    el('m-photos').onclick = showPhotoList;
    el('m-words').onclick = showWordsPages;
    el('m-dogs').onclick = showDogs;
    el('m-founders').onclick = showFounders;
    el('m-undo').onclick = showUndo;
    el('signout').onclick = function () {
      token = ''; who = '';
      localStorage.removeItem('tes-token'); localStorage.removeItem('tes-who');
      showLogin();
    };
  }

  // ------------------------------------------------------------------
  // Photos

  function showPhotoList() {
    h(
      topbar(showMenu) +
      '<h1>Change a photo</h1><p class="subtitle">Which photo would you like to change?</p>' +
      PHOTO_SLOTS.map(function (slot, i) {
        var src = slot.logo ? get(slot.path) : (get(slot.path) || {}).src;
        return (
          '<button class="item-row" data-slot="' + i + '">' +
          '<img src="' + esc(imgUrl(src)) + '" alt="">' +
          '<span>' + esc(slot.label) +
          '<span class="sub">' + esc(slot.hint || 'On the ' + slot.page + ' page') + '</span></span>' +
          '<span class="chev">›</span></button>'
        );
      }).join('') +
      '<p class="footer-help">Looking for a dog’s photo or a founder’s photo? Those live under <strong>The dogs</strong> and <strong>The founders</strong> on the main menu.</p>'
    );
    Array.prototype.forEach.call(document.querySelectorAll('[data-slot]'), function (b) {
      b.onclick = function () { showPhotoEdit(PHOTO_SLOTS[Number(b.getAttribute('data-slot'))]); };
    });
  }

  function showPhotoEdit(slot) {
    var current = slot.logo ? { src: get(slot.path), alt: '' } : get(slot.path);
    var picked = null; // {dataUrl, base64, width, height, ext}

    function draw() {
      h(
        topbar(showPhotoList) +
        '<h1>' + esc(slot.label) + '</h1>' +
        '<p class="photo-caption">' + (picked ? 'The new photo:' : 'This is the photo on the website right now:') + '</p>' +
        '<img class="photo-preview" src="' + (picked ? picked.dataUrl : esc(imgUrl(current.src))) + '" alt="">' +
        '<label class="file-label">' + (picked ? 'Pick a different photo instead' : '📷 &nbsp;Choose a new photo') +
        '<input type="file" id="file" accept="image/*"></label>' +
        (picked && !slot.logo
          ? '<label class="field-label" for="alt">What’s in the new photo? <span class="optional">(a few words — this helps visitors who can’t see well)</span></label>' +
            '<input type="text" id="alt" value="' + esc(current.alt || '') + '">'
          : '') +
        '<button class="btn-primary" id="save"' + (picked ? '' : ' disabled') + '>Put this photo on the website</button>' +
        helpFooter()
      );
      el('file').addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        working('Getting your photo ready…');
        resizeImage(f, slot.logo).then(function (result) {
          picked = result;
          draw();
        }).catch(function () {
          draw();
          showInlineError('That photo didn’t work — it may be an unusual type. Please try a different photo.');
        });
      });
      el('save').onclick = function () {
        if (!picked) return;
        var stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        var path = 'images/uploads/' + slug(slot.page + ' ' + slot.label) + '-' + stamp + '.' + picked.ext;
        var ops;
        if (slot.logo) {
          ops = [{ op: 'set', path: slot.path, value: path }];
        } else {
          ops = [{
            op: 'set', path: slot.path,
            value: { src: path, width: picked.width, height: picked.height, alt: (el('alt') ? el('alt').value.trim() : '') || current.alt || '' }
          }];
        }
        publish(
          'Changed the photo: ' + slot.label + (slot.logo ? '' : ' (' + slot.page + ' page)'),
          ops, [{ path: path, base64: picked.base64 }], showPhotoList);
      };
    }
    draw();
  }

  // ------------------------------------------------------------------
  // Words

  function showWordsPages() {
    h(
      topbar(showMenu) +
      '<h1>Change some words</h1><p class="subtitle">Which page are the words on?</p>' +
      TEXT_PAGES.map(function (p) {
        return '<button class="big-btn" data-page="' + p.key + '"><span class="icon">📄</span>' + esc(p.title) + '</button>';
      }).join('')
    );
    Array.prototype.forEach.call(document.querySelectorAll('[data-page]'), function (b) {
      b.onclick = function () { showWordsList(b.getAttribute('data-page')); };
    });
  }

  function showWordsList(pageKey) {
    var page = TEXT_PAGES.filter(function (p) { return p.key === pageKey; })[0];
    h(
      topbar(showWordsPages) +
      '<h1>' + esc(page.title) + ' page</h1><p class="subtitle">Tap the words you’d like to change.</p>' +
      TEXT_FIELDS[pageKey].map(function (f, i) {
        var v = plain(get(f.path));
        var preview = v.length > 90 ? v.slice(0, 90) + '…' : v;
        return (
          '<button class="item-row" data-field="' + i + '"><span>' + esc(f.label) +
          '<span class="sub">“' + esc(preview) + '”</span></span><span class="chev">›</span></button>'
        );
      }).join('')
    );
    Array.prototype.forEach.call(document.querySelectorAll('[data-field]'), function (b) {
      b.onclick = function () { showWordEdit(pageKey, TEXT_FIELDS[pageKey][Number(b.getAttribute('data-field'))]); };
    });
  }

  function showWordEdit(pageKey, field) {
    var current = String(get(field.path) == null ? '' : get(field.path));
    h(
      topbar(function () { showWordsList(pageKey); }) +
      '<h1>' + esc(field.label) + '</h1>' +
      '<p class="photo-caption">Change the words below, then press the green button.</p>' +
      (field.long
        ? '<textarea id="txt">' + esc(current) + '</textarea>'
        : '<textarea id="txt" class="short">' + esc(current) + '</textarea>') +
      '<button class="btn-primary" id="save">Save these words to the website</button>' +
      helpFooter()
    );
    el('save').onclick = function () {
      var v = el('txt').value.trim();
      if (!v) { showInlineError('The words can’t be empty — please write something first.'); return; }
      if (v === current.trim()) { showInlineError('Nothing changed yet — edit the words first, or press Back.'); return; }
      var page = TEXT_PAGES.filter(function (p) { return p.key === pageKey; })[0];
      publish('Changed the words: ' + field.label + ' (' + page.title + ' page)',
        [{ op: 'set', path: field.path, value: v }], [],
        function () { showWordsList(pageKey); });
    };
  }

  // ------------------------------------------------------------------
  // Dogs

  function showDogs() {
    h(
      topbar(showMenu) +
      '<h1>The dogs</h1><p class="subtitle">Tap a dog to change their photo or story.</p>' +
      content.dogs.map(function (d, i) {
        return (
          '<button class="item-row" data-dog="' + i + '">' +
          '<img src="' + esc(imgUrl(d.photo.src)) + '" alt="">' +
          '<span>' + esc(d.name) + '<span class="sub">' + esc(d.meta) + '</span></span>' +
          '<span class="chev">›</span></button>'
        );
      }).join('') +
      '<button class="btn-secondary" id="add">🐕 &nbsp;Add a new dog</button>'
    );
    Array.prototype.forEach.call(document.querySelectorAll('[data-dog]'), function (b) {
      b.onclick = function () { showDogEdit(Number(b.getAttribute('data-dog'))); };
    });
    el('add').onclick = function () { showDogForm(null); };
  }

  function showDogEdit(i) { showDogForm(i); }

  function showDogForm(index) {
    var isNew = index == null;
    var dog = isNew
      ? { name: '', meta: 'Senior | Rescued from the street', story: '', photo: { src: '', alt: '' } }
      : content.dogs[index];
    var picked = null;

    function draw() {
      h(
        topbar(showDogs) +
        '<h1>' + (isNew ? 'Add a new dog' : esc(dog.name)) + '</h1>' +
        (picked || dog.photo.src
          ? '<img class="photo-preview" src="' + (picked ? picked.dataUrl : esc(imgUrl(dog.photo.src))) + '" alt="">'
          : '') +
        '<label class="file-label">📷 &nbsp;' + (isNew ? 'Choose their photo' : 'Choose a new photo') +
        '<input type="file" id="file" accept="image/*"></label>' +
        '<label class="field-label" for="name">Name</label>' +
        '<input type="text" id="name" value="' + esc(dog.name) + '">' +
        '<label class="field-label" for="meta">The little line under the name</label>' +
        '<input type="text" id="meta" value="' + esc(dog.meta) + '">' +
        '<label class="field-label" for="story">Their story</label>' +
        '<textarea id="story">' + esc(plain(dog.story)) + '</textarea>' +
        '<button class="btn-primary" id="save">' + (isNew ? 'Add this dog to the website' : 'Save changes to the website') + '</button>' +
        (isNew ? '' : '<button class="btn-danger" id="remove">Take ' + esc(dog.name) + ' off the website</button>') +
        helpFooter()
      );
      el('file').addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        working('Getting the photo ready…');
        resizeImage(f, false).then(function (r) { picked = r; draw(); })
          .catch(function () { draw(); showInlineError('That photo didn’t work — please try a different one.'); });
      });
      el('save').onclick = function () {
        var name = el('name').value.trim();
        var meta = el('meta').value.trim();
        var story = el('story').value.trim();
        if (!name) { showInlineError('Please give the dog a name first.'); return; }
        if (!story) { showInlineError('Please write a little story for ' + name + ' first.'); return; }
        if (isNew && !picked) { showInlineError('Please choose a photo of ' + name + ' first.'); return; }

        var images = [];
        var photo = { src: dog.photo.src, alt: dog.photo.alt || name };
        if (picked) {
          var stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
          photo = { src: 'images/uploads/dog-' + slug(name) + '-' + stamp + '.' + picked.ext, alt: name };
          images.push({ path: photo.src, base64: picked.base64 });
        }
        var ops, summary;
        if (isNew) {
          ops = [{ op: 'push', path: 'dogs', value: { name: name, meta: meta, story: story, photo: photo } }];
          summary = 'Added a new dog: ' + name;
        } else {
          ops = [
            { op: 'set', path: 'dogs.' + index + '.name', value: name },
            { op: 'set', path: 'dogs.' + index + '.meta', value: meta },
            { op: 'set', path: 'dogs.' + index + '.story', value: story },
            { op: 'set', path: 'dogs.' + index + '.photo', value: photo }
          ];
          summary = 'Updated ' + name + (picked ? ' (new photo)' : '');
        }
        publish(summary, ops, images, showDogs);
      };
      if (!isNew) {
        el('remove').onclick = function () {
          h(
            topbar(function () { showDogForm(index); }) +
            '<div class="center-screen"><span class="emoji">🐾</span>' +
            '<h1>Take ' + esc(dog.name) + ' off the website?</h1>' +
            '<p>' + esc(dog.name) + '’s photo and story will come off the Meet the Dogs page. Ryan can always bring them back later.</p></div>' +
            '<button class="btn-primary" id="yes">Yes, take ' + esc(dog.name) + ' off</button>' +
            '<button class="btn-secondary" id="no">No, keep ' + esc(dog.name) + '</button>'
          );
          el('yes').onclick = function () {
            publish('Took ' + dog.name + ' off the Meet the Dogs page',
              [{ op: 'remove', path: 'dogs.' + index }], [], showDogs);
          };
          el('no').onclick = function () { showDogForm(index); };
        };
      }
    }
    draw();
  }

  // ------------------------------------------------------------------
  // Founders

  function showFounders() {
    h(
      topbar(showMenu) +
      '<h1>The founders</h1><p class="subtitle">Tap a person to change their photo or bio on the About page.</p>' +
      content.founders.map(function (f, i) {
        return (
          '<button class="item-row" data-founder="' + i + '">' +
          '<img src="' + esc(imgUrl(f.photo.src)) + '" alt="">' +
          '<span>' + esc(f.name) + '</span><span class="chev">›</span></button>'
        );
      }).join('')
    );
    Array.prototype.forEach.call(document.querySelectorAll('[data-founder]'), function (b) {
      b.onclick = function () { showFounderForm(Number(b.getAttribute('data-founder'))); };
    });
  }

  function showFounderForm(index) {
    var f = content.founders[index];
    var picked = null;

    function draw() {
      h(
        topbar(showFounders) +
        '<h1>' + esc(f.name) + '</h1>' +
        '<img class="photo-preview" src="' + (picked ? picked.dataUrl : esc(imgUrl(f.photo.src))) + '" alt="">' +
        '<label class="file-label">📷 &nbsp;Choose a new photo' +
        '<input type="file" id="file" accept="image/*"></label>' +
        '<label class="field-label" for="name">Name</label>' +
        '<input type="text" id="name" value="' + esc(f.name) + '">' +
        '<label class="field-label" for="role">Bio</label>' +
        '<textarea id="role">' + esc(plain(f.role)) + '</textarea>' +
        '<button class="btn-primary" id="save">Save changes to the website</button>' +
        helpFooter()
      );
      el('file').addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        working('Getting the photo ready…');
        resizeImage(file, false).then(function (r) { picked = r; draw(); })
          .catch(function () { draw(); showInlineError('That photo didn’t work — please try a different one.'); });
      });
      el('save').onclick = function () {
        var name = el('name').value.trim();
        var role = el('role').value.trim();
        if (!name || !role) { showInlineError('The name and bio can’t be empty.'); return; }

        var images = [];
        var photo = { src: f.photo.src, alt: name };
        if (picked) {
          var stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
          photo = { src: 'images/uploads/founder-' + slug(name) + '-' + stamp + '.' + picked.ext, alt: name };
          images.push({ path: photo.src, base64: picked.base64 });
        }
        publish('Updated founder ' + name + (picked ? ' (new photo)' : ''),
          [
            { op: 'set', path: 'founders.' + index + '.name', value: name },
            { op: 'set', path: 'founders.' + index + '.role', value: role },
            { op: 'set', path: 'founders.' + index + '.photo', value: photo }
          ],
          images, showFounders);
      };
    }
    draw();
  }

  // ------------------------------------------------------------------
  // Undo

  function showUndo() {
    working('Checking your last change…');
    api('/api/last-change').then(function (d) {
      if (!d.undoable) {
        h(
          topbar(showMenu) +
          '<div class="center-screen"><span class="emoji">✨</span>' +
          '<h1>Nothing to undo</h1>' +
          '<p>The most recent change to the website wasn’t made from this editing room, so there’s nothing here to undo. If something looks wrong on the website, email Ryan — he can fix anything.</p></div>' +
          '<button class="btn-secondary" id="back">Back to the menu</button>'
        );
        el('back').onclick = showMenu;
        return;
      }
      h(
        topbar(showMenu) +
        '<div class="center-screen"><span class="emoji">↩️</span>' +
        '<h1>Undo the last change?</h1>' +
        '<p>The last change was:</p></div>' +
        '<div class="card" style="text-align:center; font-weight:600;">' + esc(d.description) + '</div>' +
        '<button class="btn-primary" id="yes">Yes, undo it</button>' +
        '<button class="btn-secondary" id="no">No, leave it</button>'
      );
      el('yes').onclick = function () {
        working('Undoing…');
        api('/api/undo', { method: 'POST', body: JSON.stringify({ editor: who }) }).then(function (r) {
          if (r.ok) {
            refreshContent().then(function () { showSuccess('That change has been undone. The website will update in a minute or two.'); });
          } else {
            showError(showMenu, 'We couldn’t undo that — it may already be undone. If the website looks wrong, email Ryan.');
          }
        }).catch(function (e) {
          if (e.message !== 'logged-out') showError(showMenu, 'Something went wrong and nothing was changed. Please try again.');
        });
      };
      el('no').onclick = showMenu;
    }).catch(function (e) {
      if (e.message !== 'logged-out') showError(showMenu, 'We couldn’t check just now. Please try again in a minute.');
    });
  }

  // ------------------------------------------------------------------
  // Publishing

  function publish(summary, ops, images, backTo) {
    working('Sending your change to the website…');
    api('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ editor: who, summary: summary, ops: ops, images: images })
    }).then(function (d) {
      if (d.ok) {
        refreshContent().then(function () { showSuccess(null, backTo); });
      } else {
        showError(backTo || showMenu, 'The website didn’t accept that change, and nothing was altered. Please try again — and if it keeps happening, email Ryan.');
      }
    }).catch(function (e) {
      if (e.message !== 'logged-out') {
        showError(backTo || showMenu, 'We couldn’t reach the website just now, and nothing was changed. Please check your internet and try again.');
      }
    });
  }

  function refreshContent() {
    return api('/api/state').then(function (d) { content = d.content; }).catch(function () {});
  }

  function showSuccess(message, backTo) {
    h(
      '<div class="center-screen"><span class="emoji">🎉</span>' +
      '<h1>Done!</h1>' +
      '<p>' + esc(message || 'Your change is on its way to the website. It usually shows up within a minute or two — you may need to refresh the page to see it.') + '</p></div>' +
      '<button class="btn-primary" id="more">Make another change</button>' +
      '<a href="' + SITE_URL + '" class="btn-secondary" style="text-align:center; text-decoration:none;">See the website</a>'
    );
    el('more').onclick = showMenu;
  }

  function showError(backTo, message) {
    h(
      '<div class="center-screen"><span class="emoji">🙈</span>' +
      '<h1>Hmm, that didn’t work</h1>' +
      '<p>' + esc(message) + '</p></div>' +
      '<button class="btn-primary" id="back">Okay</button>' +
      helpFooter()
    );
    el('back').onclick = backTo || showMenu;
  }

  function showInlineError(message) {
    var existing = document.querySelector('.error-box');
    if (existing) existing.remove();
    var div = document.createElement('div');
    div.className = 'error-box';
    div.textContent = message;
    var btn = document.querySelector('.btn-primary');
    btn.parentNode.insertBefore(div, btn);
    div.scrollIntoView({ block: 'center' });
  }

  // ------------------------------------------------------------------
  // Image resizing — phone photos are huge; shrink them in the browser
  // so uploads are quick and the website stays fast.

  function resizeImage(file, isLogo) {
    var MAX = isLogo ? 800 : 1600;
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth, hgt = img.naturalHeight;
          if (!w || !hgt) throw new Error('empty');
          var scale = Math.min(1, MAX / Math.max(w, hgt));
          var cw = Math.round(w * scale), ch = Math.round(hgt * scale);
          var canvas = document.createElement('canvas');
          canvas.width = cw; canvas.height = ch;
          canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
          // Logos keep PNG (transparency); photos become JPEG.
          var ext = isLogo ? 'png' : 'jpg';
          var dataUrl = isLogo ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85);
          URL.revokeObjectURL(url);
          resolve({
            dataUrl: dataUrl,
            base64: dataUrl.split(',')[1],
            width: cw,
            height: ch,
            ext: ext
          });
        } catch (err) { URL.revokeObjectURL(url); reject(err); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  function slug(s) {
    var out = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return out || 'photo';
  }

  // ------------------------------------------------------------------
  // Start

  if (!token) {
    showLogin();
  } else if (!who) {
    showWho();
  } else {
    loadAndShowMenu();
  }
})();
