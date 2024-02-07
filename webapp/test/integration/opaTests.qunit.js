/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/abb/attendance_self_reg/Attendance_Self_Reg/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});