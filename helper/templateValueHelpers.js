const { format, parseISO } = require('date-fns');

// handlebars helper functions
const docHelpers = {
    formatDate: function(value) {
        if (!value) return;
        return format(parseISO(value), 'MMM d, yyyy');
    },

    formatDateMonth: function(value) {
        if (!value) return;
        return format(parseISO(value), 'MMM yyyy');
    },

    thousandsSeparator: function(value) {
        if (!value && (value !== 0)) return;
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

module.exports = docHelpers;
