var nsGmx = nsGmx || {};

+ function() {

    var SectionsSwiperWidget = Backbone.View.extend({
        className: 'sectionsSwiper',

        // options.sectionsManager
        initialize: function(options) {
            this.options = _.extend({}, options);
            this.render();
        },

        render: function() {
            this.$el.empty();

            var $swiperContainer = $('<div>').addClass('swiper-container');
            var $swiperWrapper = $('<div>').addClass('swiper-wrapper');

            this.sectionsIds = this.options.sectionsManager.getSectionsIds();

            this.sectionsIds.map(function(sectionId) {
                var sectionProps = this.options.sectionsManager.getSectionProperties(sectionId);
                var $swiperSlide = $('<div>').addClass('swiper-slide');
                $swiperSlide.html(sectionProps.description);
                $swiperSlide.appendTo($swiperWrapper);
            }.bind(this));

            $swiperWrapper.appendTo($swiperContainer);
            $swiperContainer.appendTo(this.$el);

            this.swiper = new Swiper($swiperContainer);

            this._bindEvents();
        },

        appendTo: function(el) {
            $(el).append(this.$el);
        },

        reset: function() {
            this.swiper.update();
        },

        getActiveSectionId: function() {
            return this.sectionsIds[this.swiper.activeIndex];
        },

        _bindEvents: function() {
            this.swiper.on('slideChangeStart', function() {
                this.trigger('sectionchange');
            }.bind(this))
        }
    });


    var SectionsMenuWidget = Backbone.View.extend({
        className: 'sectionsMenuWidget',

        // options.sectionsManager
        initialize: function(options) {
            this.options = _.extend({}, options);
            this.render();
        },

        render: function() {
            this.$el.empty();

            var activeSectionId = this.options.sectionsManager.getActiveSectionId();

            this.options.sectionsManager.getSectionsIds().map(function(sectionId) {
                var sectionProps = this.options.sectionsManager.getSectionProperties(sectionId)
                $sectionButton = $('<div>').addClass('sectionsMenuWidget-sectionButton').attr('data-sectionid', sectionId);
                $sectionButton.html(sectionProps.title);
                if (sectionId === this._highlightedSectionId) {
                    $sectionButton.addClass('sectionsMenuWidget-sectionButton_highlighted');
                }
                if (sectionId === activeSectionId) {
                    $sectionButton.addClass('sectionsMenuWidget-sectionButton_activeSection');
                }
                $sectionButton.appendTo(this.$el);
            }.bind(this));
        },

        appendTo: function(el) {
            $(el).append(this.$el);
        },

        highlightItem: function(sectionId) {
            this._highlightedSectionId = sectionId;
            this.render();
        }
    });

    nsGmx.MobileSectionsMenuWidget = Backbone.View.extend({
        className: 'mobileSectionsMenuWidget',

        // options.sectionsManager
        initialize: function(options) {
            this.options = _.extend({}, options);
            this.render();
        },

        render: function() {
            this.$el.empty();

            this.sectionsSwiperWidget = new SectionsSwiperWidget({
                sectionsManager: this.options.sectionsManager
            });
            this.sectionsSwiperWidget.appendTo(this.$el);

            this.sectionsMenuWidget = new SectionsMenuWidget({
                sectionsManager: this.options.sectionsManager
            });
            this.sectionsMenuWidget.appendTo(this.$el);

            this.sectionsSwiperWidget.on('sectionchange', function() {
                this.sectionsMenuWidget.highlightItem(this.sectionsSwiperWidget.getActiveSectionId());
            }.bind(this));
            this.sectionsMenuWidget.highlightItem(this.sectionsSwiperWidget.getActiveSectionId());
        },

        reset: function() {
            this.sectionsSwiperWidget && this.sectionsSwiperWidget.reset();
        }
    });

}();