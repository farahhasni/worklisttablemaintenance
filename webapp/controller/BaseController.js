/*global history */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History"
], function (Controller, History) {
	"use strict";

	return Controller.extend("com.rizing.tableit.controller.BaseController", {
		
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName) || this.getOwnerComponent().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function () {
			sap.ui.getCore().byId("backBtn").firePress();
		},

		/**
		 * Method to get Message Pop Over
		 * If there are messages, the Message Pop Over will contains all the messages
		 * @public
		 * @param {sap.ui.core.mvc.View} oView View
		 * @param {sap.ui.core.mvc.Controller} oController Controller
		 * @returns {sap.ui.xmlfragment} Message Popover
		 */		
		getMessagePopover: function (oView, oController) {
			if (!this._oMessagePopover) {
				this._oMessagePopover = sap.ui.xmlfragment(oView.getId(), "com.rizing.tableit.view.fragment.MessagePopover", oController);
				oView.addDependent(this._oMessagePopover);
			}
			
			return this._oMessagePopover;
		},

		/**
		 * Method to clear all Message Manager's messages
		 * @public
		 */		
		clearMessageManager: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
		},

		/**
		 * Method to check Error exist in Message Manager
		 * @public
		 * @returns {boolean} Boolean
		 */		
		checkErrorExist: function () {
			var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();

			for (var i = 0; i < aMessages.length; i++) {
				if (aMessages[i].type === "Error") {
					return true;
				}
			}
			return false;
		},

		/**
		 * Method to parse oData message
		 * @public
		 * @param {object} oData Data
		 */	
		parseOData: function (oData) {
			var oJSON, sMsgType;
			
			for (var i = 0; i < oData.__batchResponses.length; i++) {
				if(oData.__batchResponses[i].response === undefined){
					continue;
				}
				if (oData.__batchResponses[i].response.statusCode === "400") {
					oJSON = JSON.parse(oData.__batchResponses[i].response.body);
					sMsgType = oJSON.error.innererror.errordetails[0].severity === "error" ? "Error" : "Warning";
					sap.ui.getCore().getMessageManager().addMessages(new sap.ui.core.message.Message({
						code: oJSON.error.code,
						message: oJSON.error.message.value,
						persistent: true,
						type: sMsgType
					}));
				}
			}
		}

	});

});