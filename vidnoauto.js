(function () {
  'use strict';

  if (window.plugin_vidking_ready) return;
  window.plugin_vidking_ready = true;

  var ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zm-8-1l-5-3.5V16l5-3.5L18 16l-5-3.5z"/><path d="M9.5 8.5v7l5-3.5z"/></svg>';

  var BUTTON_HTML = '<div class="full-start__button selector view--online vidking--button" data-subtitle="VidKing">' +
    ICON +
    '<span>VidKing</span>' +
    '</div>';

  function buildUrl(movie, season, episode) {
    var id = movie.id;
    var isTV = !!(movie.name || movie.number_of_seasons);
    var base = 'https://www.vidking.net/embed/';
    if (isTV) {
      return base + 'tv/' + id + '/' + season + '/' + episode + '?nextEpisode=true&episodeSelector=true';
    }
    return base + 'movie/' + id;
  }

  function openOverlay(url) {
    $('.vidking-overlay').remove();

    var overlay = $('<div class="vidking-overlay"></div>').css({
      position: 'fixed',
      top: 0, left: 0,
      width: '100%', height: '100%',
      zIndex: 9999,
      background: '#000'
    });

    var iframe = $('<iframe allowfullscreen allow="autoplay; fullscreen; encrypted-media"></iframe>').css({
      width: '100%', height: '100%',
      border: 'none'
    }).attr('src', url);

    overlay.append(iframe);
    $('body').append(overlay);

    Lampa.Controller.add('vidking', {
      toggle: function () { Lampa.Controller.enable('vidking'); },
      up: function () {}, down: function () {},
      left: function () {}, right: function () {},
      enter: function () {},
      back: function () {
        overlay.remove();
        Lampa.Controller.toggle('full');
      }
    });

    Lampa.Controller.toggle('vidking');
  }

  function selectEpisode(movie, seasonNum) {
    var seasons = (movie.seasons || []).filter(function (s) { return s.season_number > 0; });
    var seasonData = seasons.find(function (s) { return s.season_number == seasonNum; });
    var count = seasonData ? (seasonData.episode_count || 20) : 20;

    var items = [];
    for (var i = 1; i <= count; i++) {
      items.push({ title: 'Episode ' + i, ep: i });
    }

    Lampa.Select.show({
      title: 'Season ' + seasonNum + ' — Episode',
      items: items,
      onSelect: function (item) {
        Lampa.Select.close();
        openOverlay(buildUrl(movie, seasonNum, item.ep));
      },
      onBack: function () {
        Lampa.Select.close();
      }
    });
  }

  function selectSeason(movie) {
    var count = movie.number_of_seasons || 1;
    var seasons = (movie.seasons || []).filter(function (s) { return s.season_number > 0; });

    // If only one season — skip selector, go straight to episode picker
    if (count === 1) {
      selectEpisode(movie, 1);
      return;
    }

    var items = [];
    for (var i = 1; i <= count; i++) {
      var s = seasons.find(function (s) { return s.season_number == i; });
      var label = 'Season ' + i + (s && s.episode_count ? ' (' + s.episode_count + ' ep.)' : '');
      items.push({ title: label, season: i });
    }

    Lampa.Select.show({
      title: 'VidKing — Season',
      items: items,
      onSelect: function (item) {
        Lampa.Select.close();
        selectEpisode(movie, item.season);
      },
      onBack: function () {
        Lampa.Select.close();
      }
    });
  }

  function openVidKing(movie) {
    var isTV = !!(movie.name || movie.number_of_seasons);
    if (isTV) {
      selectSeason(movie);
    } else {
      openOverlay(buildUrl(movie));
    }
  }

  function addButton(e) {
    if (!e.render.length) return;
    if (e.render.parent().find('.vidking--button').length) return;

    var btn = $(BUTTON_HTML);
    btn.on('hover:enter', function () {
      openVidKing(e.movie);
    });

    e.render.after(btn);
  }

  Lampa.Listener.follow('full', function (e) {
    if (e.type == 'complite') {
      addButton({
        render: e.object.activity.render().find('.view--torrent'),
        movie: e.data.movie
      });
    }
  });

  try {
    if (Lampa.Activity.active().component == 'full') {
      addButton({
        render: Lampa.Activity.active().activity.render().find('.view--torrent'),
        movie: Lampa.Activity.active().card
      });
    }
  } catch (e) {}

})();
