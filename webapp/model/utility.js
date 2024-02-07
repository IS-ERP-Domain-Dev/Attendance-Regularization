sap.ui.define([], function () {
	"use strict";
	return {
		convertDateFormat: function (sValue) {
			var selectedDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd.MM.YYYY"
				},
				sap.ui.getCore().getConfiguration().getLocale()
			);
			let formattedDate = null;
			if (sValue) {
				formattedDate = selectedDateFormat.format(sValue);
				return formattedDate;
			} else {
				formattedDate = selectedDateFormat.format(new Date());
				return formattedDate;
			}
		},
		
		convertDateFormatForFilter: function (sValue) {
			var selectedDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "YYYY/MM/dd"
				},
				sap.ui.getCore().getConfiguration().getLocale()
			);
			let formattedDate = null;
			if (sValue) {
				formattedDate = selectedDateFormat.format(sValue);
				return formattedDate;
			} else {
				formattedDate = selectedDateFormat.format(new Date());
				return formattedDate;
			}
		}
	};
});