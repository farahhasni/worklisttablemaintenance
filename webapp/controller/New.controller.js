sap.ui.define([
	"com/rizing/tableit/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/Component",
	"sap/ui/core/mvc/ViewType",
	"com/rizing/tableit/util/FormValidator",
	"sap/ui/model/json/JSONModel"
], function (BaseController, MessageBox, Component, ViewType, FormValidator, JSONModel) {
	"use strict";

	return BaseController.extend("com.rizing.tableit.controller.New", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			this.setModel(this._createViewModel(), "newView");
			this.getRouter().getRoute("new").attachPatternMatched(this._onObjectMatched, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		onSave: function (oEvent) {
			var sSmartFormId = this.byId("idVBoxNew").getItems()[0].getContent()[0].getId(),
				oSmartFormGroupElements = sap.ui.getCore().byId(sSmartFormId).getGroups()[0].getGroupElements();

			if (!FormValidator.checkForm(oSmartFormGroupElements, [], this.getResourceBundle())) {
				this.clearMessageManager();
				this.getModel().submitChanges({
					success: function (oData) {
						if (!this.checkErrorExist()) {
							sap.m.MessageToast.show(this.getResourceBundle().getText("successCreate"), {
								duration: 5000
							});
							
							sap.ui.getCore().byId("backBtn").firePress();
						}
					}.bind(this)
				});
			}
		},
		
		onCancel: function () {
			this.getModel().resetChanges();
			sap.ui.getCore().byId("backBtn").firePress();
		},

		/**
		 * This method is to raise Alert of any errors
		 * @public
		 * @param {sap.ui.base.Event} oEvent Event object from Message Indicator button pressed
		 */
		onMessageIndicatorPress: function (oEvent) {
			this.getMessagePopover(this.getView(), this).openBy(oEvent.getSource());
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */
		
		/**
		 * Creates the model for the view
		 * @private
		 * @return {sap.ui.model.json.JSONModel} JSON Model
		 */
		_createViewModel: function () {
			return new JSONModel({
				title: ""
			});
		},
		
		/**
		 * onObjectMatched event of the view
		 * @private
		 * @param {sap.ui.base.Event} oEvent Event object from object matched
		 */
		_onObjectMatched: function (oEvent) {
			this._sCDS = oEvent.getParameter("arguments").entitySet;
			this._showDetails();
			
			sap.ui.getCore().getMessageManager().removeAllMessages();
		},
		
		/**
		 * This method is to render the DetailForm view in runtime
		 * @private
		 * @param {string} sPath Path
		 */
		_showDetails: function () {
			var oMetaModel = this.getModel().getMetaModel();

			oMetaModel.loaded()
				.then(function () {
					var oDetailBox = this.byId("idVBoxNew"),
						oDetailView,
						sMetadataPath = oMetaModel.getODataEntitySet(this._sCDS, true);

					this._oNewContext = this.getModel().createEntry(this._sCDS);

					Component.getOwnerComponentFor(this.getView()).runAsOwner(function () {
						oDetailView = sap.ui.view({
							preprocessors: {
								xml: {
									bindingContexts: {
										meta: oMetaModel.createBindingContext(sMetadataPath)
									},
									models: {
										meta: oMetaModel
									}
								}
							},
							type: ViewType.XML,
							viewName: "com.rizing.tableit.view.NewForm"
						});
						
						oDetailView.setBindingContext(this._oNewContext);
					}.bind(this));

					oDetailBox.destroyItems();
					oDetailBox.addItem(oDetailView);
				}.bind(this))
				.catch(this._alertError.bind(this));
		},

		/**
		 * This method is to raise Alert of any errors
		 * @private
		 * @param {object} oError Error
		 */
		_alertError: function (oError) {
			MessageBox.alert(oError.message, {
				icon: MessageBox.Icon.ERROR,
				title: this.getResourceBundle().getText("errorAlertTitle")
			});
		}

	});

});