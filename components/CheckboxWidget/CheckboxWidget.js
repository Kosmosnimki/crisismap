window.nsGmx = window.nsGmx || {};

window.nsGmx.CheckboxWidget = nsGmx.GmxWidget.extend({
    className: 'checkboxWidget',

    events: {
        'click': '_onClick'
    },

    // options.model (new Backbone.Model({ state: <Boolean> }))
    initialize: function(options) {
        this.options = _.extend({
            label: ''
        }, options);
        this.options.model.on('change', this.render, this);
        this.render();
    },

    render: function() {
        this.$el.empty();

        $('<div>')
            .addClass('checkboxWidget-checkbox')
            .addClass(this.model.get('state') ? 'icon-check' : '')
            .html(this.model.get('state') ? '' : '&nbsp;')
            .appendTo(this.$el);

        if (this.options.label) {
            $('<div>')
                .addClass('checkboxWidget-label')
                .html(this.options.label)
                .appendTo(this.$el);
        }
    },

    _onClick: function() {
        this.model.set('state', !this.model.get('state'));
    }
})