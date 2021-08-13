sap.ui.define([
	"com/rizing/tableit/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("com.rizing.tableit.controller.DetailForm", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * This Event Handler handle onEdit event
		 * @public
		 * @param {sap.ui.base.Event} oEvent Event object from smartform edit button pressed
		 */
		onEditToggled: function (oEvent) {
			if (oEvent.getParameter("editable")) {
				//Disable key fields
				this._disablePKfields(oEvent.getSource().getBindingContext());
			}
		},

		/**
		 * This Event Handler handle onChange event
		 * @public
		 * @param {sap.ui.base.Event} oEvent Event object from smartfield input change
		 */
		onChange: function (oEvent) {
			this._disablePKfields(oEvent.getSource().getBindingContext());
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * This method disable Primary Key fields depend on the schema metadata
		 * @rivate
		 * @param {object} oBindingContext Binding Context
		 */
		_disablePKfields: function (oBindingContext) {
			var sSmartFormId = this.getView().getParent().getItems()[0].getContent()[0].getId(),
				oMetadata = this.getView().getModel().getMetaModel().oMetadata,
				aKeyFields = oMetadata._getEntityTypeByPath(oBindingContext).key.propertyRef,
				aElements = this.byId(sSmartFormId).getGroups()[0].getGroupElements();

			for (var i = 0; i < aElements.length; i++) {
				var oField = aElements[i].getFields()[0];
				for (var x = 0; x < aKeyFields.length; x++) {
					if (aKeyFields[x].name === oField._oValueBind.path) {
						oField.setContextEditable(false);
						oField.setEditable(false);
					}
				}
			}
		}

	});

});