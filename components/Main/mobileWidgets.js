if (nsGmx.CrisisMap.isMobile()) {
    cm.define('rootPageView', ['layoutManager'], function(cm) {
        var layoutManager = cm.get('layoutManager');

        var rootPageView = new nsGmx.PageView();
        rootPageView.appendTo(layoutManager.getContentContainer());

        return rootPageView;
    });

    cm.define('mapContainer', ['rootPageView'], function(cm) {
        var rootPageView = cm.get('rootPageView');
        var mapPage = rootPageView.addPage('map');
        rootPageView.setActivePage('map');
        return $('<div>').addClass('crisisMap-mapPage').appendTo(mapPage)[0];
    });

    cm.define('markerCursor', ['map'], function(cm) {
        var map = cm.get('map');
        var marker = L.marker([0, 0]);
        return {
            show: function() {
                map.addLayer(marker);
            },
            hide: function() {
                map.removeLayer(marker);
            },
            setLatLng: function() {
                marker.setLatLng.apply(marker, arguments);
            }
        }
    });

    cm.define('infoControl', ['map', 'mapLayoutHelper', 'markerCursor'], function(cm) {
        var map = cm.get('map');
        var mlh = cm.get('mapLayoutHelper');
        var mc = cm.get('markerCursor');

        var infoControl = new nsGmx.InfoControl({
            position: 'center'
        });

        map.addControl(infoControl);

        return infoControl;
    });

    cm.define('headerLayersMenu', ['map', 'config', 'sectionsManager', 'layersHash', 'headerNavBar', 'widgetsManager'], function() {
        var map = cm.get('map');
        var config = cm.get('config');
        var layersHash = cm.get('layersHash');
        var headerNavBar = cm.get('headerNavBar');
        var sectionsManager = cm.get('sectionsManager');
        var widgetsManager = cm.get('widgetsManager');

        var dropdownWidget = new nsGmx.DropdownWidget({
            title: sectionsManager.getSectionProperties(sectionsManager.getActiveSectionId()).title,
            showTopItem: false,
            trigger: 'click'
        });

        dropdownWidget.on('item', function(id) {
            sectionsManager.setActiveSectionId(id);
            cm.get('markerLayersPopupsManager') && cm.get('markerLayersPopupsManager').reset();
            var layer = layersHash[sectionsManager.getSectionProperties(id).dataLayerId];
            layer && nsGmx.L.Map.fitBounds.call(
                map,
                layer.getBounds()
            );
            dropdownWidget.setTitle(sectionsManager.getSectionProperties(id).title);
        });

        var sectionsIds = sectionsManager.getSectionsIds();
        for (var i = 0; i < sectionsIds.length; i++) {
            dropdownWidget.addItem(sectionsIds[i], new nsGmx.PlainTextWidget(
                sectionsManager.getSectionProperties(sectionsIds[i]).title
            ));
        }

        dropdownWidget.appendTo(headerNavBar.getCenterContainer());

        widgetsManager.add(dropdownWidget);

        return dropdownWidget;
    });

    cm.define('headerLayoutButton', ['headerNavBar', 'rootPageView', 'map'], function(cm) {
        var map = cm.get('map');
        var rootPageView = cm.get('rootPageView');
        var headerNavBar = cm.get('headerNavBar');

        var HeaderLayoutButton = nsGmx.GmxWidget.extend({
            className: 'headerLayoutButton icon-bell',
            events: {
                'click': function() {
                    this.toggleState();
                }
            },
            toggleState: function() {
                this.$el.toggleClass('icon-bell');
                this.$el.toggleClass('icon-globe');
                this.trigger('stateswitch', this.getState());
            },
            getState: function() {
                return this.$el.hasClass('icon-bell') ? 'map' : 'alerts';
            }
        });

        var headerLayoutButton = new HeaderLayoutButton();

        headerLayoutButton.appendTo(headerNavBar.getRightContainer());

        headerLayoutButton.on('stateswitch', function(state) {
            if (state === 'map') {
                rootPageView.setActivePage('map');
                map.invalidateSize();
            } else {
                rootPageView.setActivePage('alerts');
            }
        });

        return headerLayoutButton;
    });

    // компонент, отображающий попапы маркеров
    cm.define('markerLayersPopupsManager', ['config', 'infoControl', 'headerNavBar', 'markersClickHandler'], function(cm) {
        var map = cm.get('map');
        var config = cm.get('config');
        var layersHash = cm.get('layersHash');
        var headerNavBar = cm.get('headerNavBar');
        var markersClickHandler = cm.get('markersClickHandler');

        var MLPM = L.Class.extend({
            initialize: function(options) {
                L.setOptions(this, options);
            },
            show: function(model) {
                var map = cm.get('map');
                var mapLayoutHelper = cm.get('mapLayoutHelper');
                this.options.mapLayoutHelper.hideBottomControls();
                this.options.infoControl.render(model);
                this.options.infoControl.show();
                map.setActiveArea({
                    bottom: getFullHeight(this.options.infoControl.getContainer()) + 'px'
                });
                map.setView(model.get('latLng'), map.getZoom());
                this.options.markerCursor.setLatLng(model.get('latLng'));
                this.options.markerCursor.show();
            },
            reset: function() {
                this.options.infoControl.hide();
                this.options.mapLayoutHelper && this.options.mapLayoutHelper.showBottomControls();
                this.options.mapLayoutHelper.resetActiveArea();
                this.options.markerCursor.hide();
            }
        });

        var mlpm = new MLPM({
            infoControl: cm.get('infoControl'),
            markerCursor: cm.get('markerCursor'),
            mapLayoutHelper: cm.get('mapLayoutHelper')
        });

        headerNavBar.on('select', function() {
            mlpm.reset();
        });

        map.on('click', function() {
            mlpm.reset();
        });

        markersClickHandler.on('click', function(e) {
            mlpm.show(e.model);
        })

        return mlpm;
    });

    cm.define('alertsPageView', ['rootPageView'], function(cm) {
        var rootPageView = cm.get('rootPageView');

        var alertsPageView = new nsGmx.PageView();
        var $alertsPage = $(rootPageView.addPage('alerts')).addClass('pageView-item_alerts');
        alertsPageView.appendTo($alertsPage);

        return alertsPageView;
    });

    cm.define('alertsPages', ['alertsPageView', 'sectionsManager', 'headerLayoutButton', 'markerLayersPopupsManager', 'newsLayersCollections'], function(cm) {
        var markerLayersPopupsManager = cm.get('markerLayersPopupsManager');
        var newsLayersCollections = cm.get('newsLayersCollections');
        var headerLayoutButton = cm.get('headerLayoutButton');
        var sectionsManager = cm.get('sectionsManager');
        var alertsPageView = cm.get('alertsPageView');

        var scrollViews = {}
        sectionsManager.getSectionsIds().map(function(sectionId) {
            var page = alertsPageView.addPage(sectionId);
            var markersCollectionView = new nsGmx.SwitchingCollectionWidget({
                className: 'alertsCollectionView',
                collection: newsLayersCollections[sectionId],
                itemView: nsGmx.AlertItemView,
                reEmitEvents: ['marker']
            });
            markersCollectionView.on('marker', function(model) {
                headerLayoutButton.toggleState();
                markerLayersPopupsManager.show(model);
            });
            var scrollView = scrollViews[sectionId] = new nsGmx.ScrollView({
                views: [markersCollectionView]
            });
            scrollView.appendTo(page);
        });

        alertsPageView.setActivePage(sectionsManager.getActiveSectionId());

        sectionsManager.on('sectionchange', function(sectionId) {
            alertsPageView.setActivePage(sectionId);
            scrollViews[sectionId].repaint();
        });

        headerLayoutButton.on('stateswitch', function(state) {
            if (state === 'alerts') {
                for (name in scrollViews) {
                    if (scrollViews.hasOwnProperty(name)) {
                        scrollViews[name].repaint();
                    }
                }
            }
        });

        return null;
    });

    cm.define('calendarPage', ['calendar', 'rootPageView', 'headerMainMenu'], function(cm) {
        var calendar = cm.get('calendar');
        var rootPageView = cm.get('rootPageView');
        var headerMainMenu = cm.get('headerMainMenu');

        var $container = rootPageView.addPage('calendar');
        var calendarPage = new nsGmx.CalendarPage({
            model: calendar
        });
        calendarPage.appendTo($container);

        headerMainMenu.addItem('calendar', new nsGmx.PlainTextWidget(nsGmx.Translations.getText('crisismap.archive')));
        headerMainMenu.on('item', function(id) {
            if (id === 'calendar') {
                rootPageView.setActivePage('calendar');
            }
        });

        calendarPage.on('datepickerchange', function() {
            rootPageView.back();
        });

        return calendarPage;
    });
}