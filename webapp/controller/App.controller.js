sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/utility",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, formatter, BusyIndicator, MessageBox, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("com.abb.attendance_self_reg.Attendance_Self_Reg.controller.App", {
		formatter: formatter,

		onInit: function () {
			this._makeODataServiceCall();
		},

		_makeODataServiceCall: function () {

			this.odatamodel = this.getOwnerComponent().getModel("odata");
			this.oGlobalPayrollData = "";

			//To get attendance type data
			this._getAttendanceType();

			//To get start date and End Date
			this._getStartAndEndDate();

			// //To get Header and payroll Items data
			// this._callMainMethodServiceCall("");
		},

		_callMainMethodServiceCall: function () {
			BusyIndicator.show();
			var that = this;

			//Fetch data from start and end date
			let sPeriodFrom = this.getView().byId("periodFromDate").getProperty("value");
			let sPeriodTo = this.getView().byId("periodToDate").getProperty("value");

			let sConvertedStartDate = sPeriodFrom.split("/").join("");
			let sConvertedEndDate = sPeriodTo.split("/").join("");

			let aFilter = [];
			aFilter.push(new Filter("PeriodFrom", FilterOperator.EQ, sConvertedStartDate));
			aFilter.push(new Filter("PeriodTo", FilterOperator.EQ, sConvertedEndDate));
			
			this.odatamodel.read("/PayrollHdrs", {
				urlParameters: {
					"$expand": "PayrollItems"
				},
				filters: aFilter,
				success: function (data) {
					// console.log("Header Data for Payroll >> ", data);
					BusyIndicator.hide();
					that.oGlobalPayrollData = data;
					that._setPayrollModelData(data);
				},
				error: function () {
					BusyIndicator.hide();
					let oPayrollModel = that.getOwnerComponent().getModel("payrollData");
					let oDataRes = {
						"EnableButtons": false
					};
					oPayrollModel.setData(oDataRes);
					sap.m.MessageToast.show("No data found");
				}
			});
		},

		_setPayrollModelData: function (data) {
			let oPayrollModel = this.getOwnerComponent().getModel("payrollData");
			let oHeaderData = data.results[0];
			let sEnableButtons = oHeaderData.PayrollItems.results.length > 0 ? true : false;
			let sUpdatedItem = this._addAttendanceType(oHeaderData.PayrollItems.results);
			let sLength = sUpdatedItem.length;
			let oDataRes = {
				"Count": sLength,
				"EmpName": oHeaderData.EmpName,
				"Persno": oHeaderData.Persno,
				"WageType": oHeaderData.WageType,
				"WageTypeText": oHeaderData.WageTypeText,
				"EnableButtons": sEnableButtons,
				"PayrollItems": sUpdatedItem
			};
			oPayrollModel.setData(oDataRes);
			// oPayrollModel.setSizeLimit(sLength);
		},

		_addAttendanceType: function (data) {
			let aItem = data;
			let oAttendTypeModel = this.getOwnerComponent().getModel("attendanceType");
			aItem.forEach((item) => {
				item.AttendType = oAttendTypeModel.getProperty("/");
			});
			return aItem;
		},

		_getStartAndEndDate: function () {
			var that = this;
			this.odatamodel.read("/PeriodDetails(Persno='40001282')", {
				success: function (data) {
					// console.log("Dates from backend >> ", data);
					var oModel = that.getOwnerComponent().getModel("payrollDateModel");
					let oDataRes = {
						"EmpName": data.EmpName,
						"Persno": data.Persno,
						"PeriodFrom": new Date(data.PeriodFrom),
						"PeriodTo": new Date(data.PeriodTo)
					};
					// console.log("After converting stringd to date format>> ", oDataRes);
					oModel.setData(oDataRes);

					//To get Header and payroll Items data
					that._callMainMethodServiceCall();
				},
				error: function () {
					sap.m.MessageToast.show("No Data found");
				}
			});
		},

		_getAttendanceType: function () {
			var that = this;
			this.odatamodel.read("/AttendenceTypes", {
				success: function (data) {
					// console.log("Attendance Types Data >> ", data);
					var oModel = that.getOwnerComponent().getModel("attendanceType");
					oModel.setData(data);
					that._setDataForAttendanceTypes(data);
				},
				error: function () {
					sap.m.MessageToast.show("No Attendance types found");
				}
			});
		},

		_setDataForAttendanceTypes: function (data) {
		
			let aItems = data.results;
			let aUpdatedItem = [];
			aItems.forEach((item) => {
				let sText = item.AttendType;
				let [first, ...rest] = sText.split('-');
				let sDesc = rest.join('-');
				let sKey = first;
				aUpdatedItem.push({
					AttendType: sText,
					Key: sKey,
					Desc: sDesc,
					selected: false
				});
			});
			var oModel = this.getOwnerComponent().getModel("attendanceType");
			oModel.setData(aUpdatedItem);
		},

		onChangeOfAttendanceType: function (oEvent) {
			let sSelectedRadioBtn = oEvent.getSource().getProperty("selectedIndex");
			let oSelectedRow = oEvent.getSource().getBindingContext("payrollData").getPath();
			let oPayrollModel = this.getOwnerComponent().getModel("payrollData");
			let sAttTypeVal = "0" + (sSelectedRadioBtn + 1);
			let sVal = Number(sAttTypeVal) - 1;
			let sKeyDesc = this.getOwnerComponent().getModel("attendanceType").getProperty("/")[sVal].AttendType;
			oPayrollModel.setProperty(oSelectedRow + "/AttendanceType", sKeyDesc);
		},

		onMarkAsPresentPressed: function () {
			var oModel = this.getView().getModel("payrollData");
			var aReports = oModel.getProperty("/PayrollItems");
			let sKeyDesc = this.getOwnerComponent().getModel("attendanceType").getProperty("/")[0].AttendType;
			var aUpdatedItem = aReports.map((item) => {
				if (item.AttendanceType !== '01') {
					item.AttendanceType = sKeyDesc;
					item.selectedIndex = 1;
				}
				return item;
			});
			oModel.setProperty("/PayrollItems", aUpdatedItem);
		},

		onResetPressed: function () {
			var oModel = this.getView().getModel("payrollData");
			var aReports = oModel.getProperty("/PayrollItems");
			var aUpdatedItem = aReports.map((item) => {
				item.AttendanceType = "";
				item.selectedIndex = null;
				return item;
			});
			oModel.setProperty("/PayrollItems", aUpdatedItem);
		},

		_checkActionOnEveryRow: function (oCustomObject) {
			let aItems = oCustomObject.PayrollItems;
			// let isAttTypeEmpty = aItems.filter((item) => item.AttendanceType === "");
			let isAttTypeEmpty = aItems.filter((item) => item.AttendanceType !== "");
			return isAttTypeEmpty.length;
		},

		_removeProxyData: function (aResult) {
			let aUpdatedResultItems = [];
			aResult.forEach((item) => {
				let oProxyObj = {};
				oProxyObj.AttendanceType = item.AttendanceType;
				oProxyObj.EmpName = item.EmpName;
				oProxyObj.EndDate = item.EndDate;
				oProxyObj.Flag = item.Flag;
				oProxyObj.LossOfPay = item.LossOfPay;
				oProxyObj.Persno = item.Persno;
				oProxyObj.StartDate = item.StartDate;
				oProxyObj.WageType = item.WageType;
				oProxyObj.WageTypeText = item.WageTypeText;
				if(item.AttendanceType !== ""){
					aUpdatedResultItems.push(oProxyObj);
				}
			});
			// console.log("Final PayrollItems Data >> ", aUpdatedResultItems);
			return aUpdatedResultItems;
		},

		_prepareFinalCustomObject: function () {
			let oPayrollModel = this.getOwnerComponent().getModel("payrollData");
			let oCustomObj = oPayrollModel.getProperty("/");

			let aUpdPayrolltems = this._removeProxyData(oCustomObj.PayrollItems);

			let oUpdatedResult = {
				"EmpName": oCustomObj.EmpName,
				"Message": oCustomObj.Message,
				"MsgType": oCustomObj.MsgType,
				"PayrollItems": aUpdPayrolltems,
				"Persno": oCustomObj.Persno,
				"WageType": oCustomObj.WageType,
				"WageTypeText": oCustomObj.WageTypeText
			};
			// console.log("Final Object To be post >> ", oUpdatedResult);
			return oUpdatedResult;
		},

		onUpdatePayrollPressed: function () {
			
			let oPayrollModel = this.getOwnerComponent().getModel("payrollData");
			let oCustomObj = oPayrollModel.getProperty("/");

			let isEmpty = this._checkActionOnEveryRow(oCustomObj);

			if (isEmpty >= 1) {

				// console.log("DATA BEFORE POST >> ", oCustomObj);

				//Remove proxy data from Model and prepare custom data to update
				let oUpdatedObject = this._prepareFinalCustomObject();

				BusyIndicator.show();
				this.odatamodel.create("/PayrollHdrs", oUpdatedObject, {
					success: function (data) {
						BusyIndicator.hide();
						if (data.MsgType === 'E') {
							MessageBox.error(data.Message);
						} else {
							MessageBox.success(data.Message);
						}
					},
					error: function () {
						/* do something */
						BusyIndicator.hide();
						sap.m.MessageToast.show("Failed to Update the Data to Back-end");
					}
				});
			} else {
				MessageBox.error("Please take action on at least one rows.");
			}
		},

		onFilterBarSearch: function () {
			this._callMainMethodServiceCall();
		}
	});
});