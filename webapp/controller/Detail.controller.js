sap.ui.define([
	"com/rizing/tableit/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/core/Component",
	"sap/ui/core/mvc/ViewType",
	"com/rizing/tableit/util/FormValidator",
	"sap/ui/model/json/JSONModel"
], function (BaseController, MessageBox, Component, ViewType, FormValidator, JSONModel) {
	"use strict";

	return BaseController.extend("com.rizing.tableit.controller.Detail", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * This Event Handler handle onInit event
		 * @public
		 */
		onInit: function () {
			this.setModel(this._createViewModel(), "detailView");
			this.getRouter().getRoute("detail").attachPatternMatched(this._onObjectMatched, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		
		/**
		 * This Event Handler handle onBack event
		 * @public
		 */
		onBack: function () {
			this.getModel().resetChanges();
			this.onNavBack();
		},
		
		/**
		 * This Event Handler on toggling edit button
		 * @public
		 * @param {sap.ui.base.Event} oEvent Event object from edit button pressed
		 */
		onEditToggled: function (oEvent) {
			var bEdit = oEvent.getParameter("pressed");
			
			if (bEdit) {
				this.byId("idEditToggleButton").setText(this.getResourceBundle().getText("display"));
			} else {
				this.byId("idEditToggleButton").setText(this.getResourceBundle().getText("edit"));
			}
			
			this.getModel("detailView").setProperty("/showFooter", bEdit);
			this.byId("idVBoxDetail").getItems()[0].getContent()[0].setEditable(bEdit);
		},

		/**
		 * This Event Handler handle onInsert event
		 * @public
		 * @param {sap.ui.base.Event} oEvent Event object from insert button pressed
		 */
		onInsert: function (oEvent) {
			var sPath = "/" + this._sCDS;
			this.getModel().createEntry(sPath);
			this._showDetails(sPath);
		},
		
		onDelete: function (oEvent) {
			var sPath = this.byId("idVBoxDetail").getItems()[0].getBindingContext().getPath();
			
			this.getModel().remove(sPath, {
				success: function () {
					sap.m.MessageToast.show(this.getResourceBundle().getText("successDelete"), {
						duration: 5000
					});
					
					this.onNavBack();
				}.bind(this)
			});
		},

		/**
		 * This Event Handler handle Save event
		 * @public
		 * @param {sap.ui.base.Event} oEvent Event object from save button pressed
		 */
		onSave: function (oEvent) {
			var sSmartFormId = this.byId("idVBoxDetail").getItems()[0].getContent()[0].getId();
			var oSmartFormGroupElements = sap.ui.getCore().byId(sSmartFormId).getGroups()[0].getGroupElements();

			if (!FormValidator.checkForm(oSmartFormGroupElements, [], this.getResourceBundle())) {
				this.clearMessageManager();
				
				if (!this.getModel().hasPendingChanges()) {
					sap.m.MessageToast.show(this.getResourceBundle().getText("errorNoChangesFound"));
				}

				this.getModel().submitChanges({
					success: function (oData) {
						this.parseOData(oData); //MessageManager dont work here, so parse it manually

						if (!this.checkErrorExist()) {
							sap.m.MessageToast.show(this.getResourceBundle().getText("successUpdate"), {
								duration: 5000
							});
							
							this.onNavBack();
						}
					}.bind(this)
				});
			}
		},
		
		onCancel: function () {
			this.getModel().resetChanges();
			this.onNavBack();
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
				title: "",
				showFooter: false
			});
		},

		/**
		 * onObjectMatched event of the view
		 * @private
		 * @param {sap.ui.base.Event} oEvent Event object from object matched
		 */
		_onObjectMatched: function (oEvent) {
			this._sCDS = oEvent.getParameter("arguments").entitySet;
			this._sPath = "/" + oEvent.getParameter("arguments").sPath;
			this._showDetails(this._sPath);

			sap.ui.getCore().getMessageManager().removeAllMessages();
		},

		/**
		 * This method is to render the DetailForm view in runtime
		 * @private
		 * @param {string} sPath Path
		 */
		_showDetails: function (sPath) {
			var oMetaModel = this.getModel().getMetaModel();

			oMetaModel.loaded()
				.then(function () {
					var oDetailBox = this.byId("idVBoxDetail"),
						oDetailView,
						sMetadataPath = oMetaModel.getODataEntitySet(this._sCDS, true);

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
							viewName: "com.rizing.tableit.view.DetailForm"
						});
						
						oDetailView.bindElement(sPath);
					});

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