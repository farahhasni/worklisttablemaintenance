sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/rizing/tableit/model/models",
	"com/rizing/tableit/controller/ErrorHandler",
	"com/rizing/tableit/util/Helper",
	"sap/ui/core/util/XMLPreprocessor"
], function (UIComponent, Device, models, ErrorHandler, Helper, XMLPreprocessor) {
	"use strict";

	return UIComponent.extend("com.rizing.tableit.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// initialize the error handler with the component
			this._oErrorHandler = new ErrorHandler(this);

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// create the views based on the url/hash
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// set message model
			this.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");

			/*
			 * Plug-in a visitor for XMLPreprocessor to replace
			 * <sap.ui.core.sample.ViewTemplate.scenario:Form binding="..." title="...">
			 * with
			 * <sap.ui.layout.form:SimpleForm binding="...">
			 *   <sap.ui.layout.form:title>
			 *     <sap.ui.core.Title text="..."/>
			 *   </sap.ui.layout.form:title>
			 *   <!-- children -->
			 * </sap.ui.layout.form:SimpleForm>
			 *
			 * @param {Element} oForm
			 *   The <sap.ui.core.sample.ViewTemplate.scenario:Form> element
			 * @param {object} oInterface
			 *   Visitor callbacks
			 */
			XMLPreprocessor.plugIn(function (oForm, oInterface) {
				var sBinding = oForm.getAttribute("binding"),
					oChild,
					oDocument = oForm.ownerDocument,
					oSmartForm = oDocument.createElementNS("sap.ui.comp.smartform", "SmartForm");

				if (sBinding) {
					oSmartForm.setAttribute("binding", sBinding);
				}

				oSmartForm.setAttribute("id", "idSmartForm");
				oSmartForm.setAttribute("editable", "false");
				oSmartForm.setAttribute("editToggled", "onEditToggled");
				oSmartForm.setAttribute("checked", "onChecked");

				while (oChild === oForm.firstChild) {
					oSmartForm.appendChild(oChild);
				}

				oForm.parentNode.insertBefore(oSmartForm, oForm);
				oForm.parentNode.removeChild(oForm);

				oInterface.visitNode(oSmartForm);
			}, "com.rizing.tableit.view.fragment", "SmartForm");
		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ListSelector and ErrorHandler are destroyed.
		 * @public
		 * @override
		 */
		destroy: function () {
			this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function () {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}

	});

});