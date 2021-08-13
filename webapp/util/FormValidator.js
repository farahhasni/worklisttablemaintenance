sap.ui.define([], function () {
	"use strict";

	return {
		
		checkForm: function (smartFormGroupArray, aAdditionalFields, oResourceBundle) {
			var hasError = false;

			// check every single control
			for (var groupElementIndex in smartFormGroupArray) {
				var smartFieldsArray = smartFormGroupArray[groupElementIndex].getElements();

				for (var smartFieldIndex in smartFieldsArray) {
					if (smartFieldsArray[smartFieldIndex].getMetadata().getName() === "sap.ui.comp.smartfield.SmartField") {
						if (smartFieldsArray[smartFieldIndex].getMandatory() && (smartFieldsArray[smartFieldIndex].getValue() === "")) {
							smartFieldsArray[smartFieldIndex].setValueState(sap.ui.core.ValueState.Error);
							smartFieldsArray[smartFieldIndex].setValueStateText(oResourceBundle.getText("errorGeneralEmpty"));
							hasError = true;
						} else if (smartFieldsArray[smartFieldIndex].getMandatory() &&
							(smartFieldsArray[smartFieldIndex].getValue() === "0" ||
								smartFieldsArray[smartFieldIndex].getValue() === "0.00")) {
							smartFieldsArray[smartFieldIndex].setValueState(sap.ui.core.ValueState.Error);
							smartFieldsArray[smartFieldIndex].setValueStateText(oResourceBundle.getText("errorZeroAmount"));
							hasError = true;
						} else if (smartFieldsArray[smartFieldIndex].getMandatory() &&
							(smartFieldsArray[smartFieldIndex].getValueState() === sap.ui.core.ValueState.Error)) {
							// smartFieldsArray[smartFieldIndex].setValueStateText(oResourceBundle.getText("nonNumericEntry"));
							hasError = true;
						}
					}
				}
			}

			//check additional fields
			for (var i in aAdditionalFields) {
				if (sap.ui.getCore().byId(aAdditionalFields[i]).getValue !== undefined) {
					if ((sap.ui.getCore().byId(aAdditionalFields[i]).getMetadata().getName() === "sap.m.Input" || sap.ui.getCore().byId(
							aAdditionalFields[i]).getMetadata().getName() === "sap.m.DatePicker") && sap.ui.getCore().byId(aAdditionalFields[i]).getValue() ===
						"") {
						sap.ui.getCore().byId(aAdditionalFields[i]).setValueState(sap.ui.core.ValueState.Error);
						sap.ui.getCore().byId(aAdditionalFields[i]).setValueStateText(oResourceBundle.getText("errorGeneralEmpty"));
						hasError = true;
					}
				}
				
				if (sap.ui.getCore().byId(aAdditionalFields[i]).getSelectedKey !== undefined) {
					if (sap.ui.getCore().byId(aAdditionalFields[i]).getMetadata().getName() === "sap.m.Select" && sap.ui.getCore().byId(
							aAdditionalFields[i]).getSelectedKey() === "") {
						sap.ui.getCore().byId(aAdditionalFields[i]).setValueState(sap.ui.core.ValueState.Error);
						sap.ui.getCore().byId(aAdditionalFields[i]).setValueStateText(oResourceBundle.getText("errorGeneralEmpty"));
						hasError = true;
					}
				}
			}

			return hasError;
		},
		
		clearValidation: function (smartFormGroupArray, aAdditionalFields, oResourceBundle) {
			// check every single control
			for (var groupElementIndex in smartFormGroupArray) {
				var smartFieldsArray = smartFormGroupArray[groupElementIndex].getElements();

				for (var smartFieldIndex in smartFieldsArray) {
					if (smartFieldsArray[smartFieldIndex].getMetadata().getName() === "sap.ui.comp.smartfield.SmartField") {
						smartFieldsArray[smartFieldIndex].setValueState(sap.ui.core.ValueState.None);
						smartFieldsArray[smartFieldIndex].setValueStateText();
					}
				}

				//clear additional fields
				for (var i in aAdditionalFields) {
					sap.ui.getCore().byId(aAdditionalFields[i]).setValueState(sap.ui.core.ValueState.None);
					sap.ui.getCore().byId(aAdditionalFields[i]).setValueStateText();
				}
			}
		}
		
	};
	
});