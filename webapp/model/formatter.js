sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Date formatter
		 * @public
		 * @param {string} sDate Date
		 * @returns {string} Formatted date
		 */
		convertDate: function (sDate) {
			function padInput(sInput) {
				return (sInput < 10) ? "0" + sInput : sInput;
			}

			var oDate = new Date(sDate);

			return [padInput(oDate.getDate()), padInput(oDate.getMonth() + 1), oDate.getFullYear()].join("/");
		},

		/**
		 * Date formatter
		 * @public
		 * @param {string} sMilliseconds Milliseconds
		 * @returns {string} Formatted Time
		 */
		convertMStoTime: function (sMilliseconds) {
			var iSeconds = (sMilliseconds / 1000).toFixed(0),
				iMinutes = Math.floor(iSeconds / 60),
				sHours;

			if (iMinutes > 59) {
				sHours = Math.floor(iMinutes / 60);
				sHours = (sHours >= 10) ? sHours : "0" + sHours;
				iMinutes = iMinutes - (sHours * 60);
				iMinutes = (iMinutes >= 10) ? iMinutes : "0" + iMinutes;
			}

			iSeconds = Math.floor(iSeconds % 60);
			iSeconds = (iSeconds >= 10) ? iSeconds : "0" + iSeconds;

			if (sHours !== "") {
				return sHours + ":" + iMinutes + ":" + iSeconds;
			}

			return iMinutes + ":" + iSeconds;
		}

	};

});