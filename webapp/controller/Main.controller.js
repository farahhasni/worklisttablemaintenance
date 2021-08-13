sap.ui.define([
	"com/rizing/tableit/controller/BaseController",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"com/rizing/tableit/model/formatter"
], function (BaseController, Device, JSONModel, MessageBox, formatter) {
	"use strict";

	return BaseController.extend("com.rizing.tableit.controller.Main", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the S1 controller is instantiated.
		 * @public
		 */
		onInit: function () {
			this.setModel(this._createViewModel(), "mainView");

			this.getRouter().getRoute("main").attachPatternMatched(this._onObjectMatched, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		onOpenTable: function () {
			if (!this._oOpenTableDialog) {
				this._oOpenTableDialog = sap.ui.xmlfragment(this.getView().getId(), "com.rizing.tableit.view.fragment.OpenTable",
					this);
				this.getView().addDependent(this._oOpenTableDialog);
			}

			this._oOpenTableDialog.open();
		},

		onOkTableSelect: function () {
			this._showFormFragment(this._sCDS);
			this.getModel("mainView").setProperty("/title", this.getResourceBundle().getText("titleAndTable", [this._sTableName]));
			this.getModel("mainView").setProperty("/tableName", this._sTableDescription);
			this.getModel("mainView").setProperty("/addDeleteEnabled", true);
			this._checkRelation(this._sTableName);
			this._oRelMenu = undefined;
			this._oOpenTableDialog.close();
		},

		onCancelTableSelect: function () {
			this._oOpenTableDialog.close();
		},

		onSelectChange: function (oEvent) {
			var oBindingContext = oEvent.getParameter("selectedItem").getBindingContext();

			this._sCDS = oBindingContext.getProperty("CDS");
			this._sTableName = oBindingContext.getProperty("TableName");
			this._sTableDescription = oBindingContext.getProperty("Description");
		},

		onItemDetailPress: function (oEvent) {
			this._sPath = oEvent.getSource().getBindingContext().sPath.slice(1);

			this.getRouter().navTo("detail", {
				entitySet: this._sCDS,
				sPath: this._sPath
			}, false);
		},

		onAdd: function () {
			this.getOwnerComponent().setModel(this.getModel("mainView"), "mainGlobal");

			this.getRouter().navTo("new", {
				entitySet: this._sCDS
			}, false);
		},

		onDelete: function () {
			var aSelectedItems = this.byId("idSmartTable").getTable().getSelectedItems();

			if (aSelectedItems.length > 0) {
				MessageBox.show(this.getResourceBundle().getText("deleteConfirmation"), {
					icon: MessageBox.Icon.WARNING,
					title: this.getResourceBundle().getText("deleteDialogTitle"),
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.YES) {
							for (var i = 0; i < aSelectedItems.length; i++) {
								this.getModel().remove(aSelectedItems[i].getBindingContextPath());
							}
						}
					}.bind(this)
				});
			} else {
				sap.m.MessageBox.information(this.getResourceBundle().getText("deleteNoRecordSelected"));
			}
		},

		onMenuItemPress: function (oEvent) {
			var aSelectedItems = this.byId("idSmartTable").getTable().getSelectedItems();

			this._showFormFragment(oEvent.getParameter("item").getKey());
			this._sCDS = oEvent.getParameter("item").getKey();

			var aFilter = [new sap.ui.model.Filter("CDS", sap.ui.model.FilterOperator.EQ, this._sCDS)];

			this._readMasterTable(aFilter).then(function (oData) {
				this.getModel("mainView").setProperty("/title", this.getResourceBundle().getText("titleAndTable", [oData.results[0].TableName]));
				this.getModel("mainView").setProperty("/tableName", oData.results[0].Description);
				this.getModel("mainView").setProperty("/addDeleteEnabled", true);
				this._checkRelation(oData.results[0].TableName);
			}.bind(this));

			var oMetaData = this.getView().getModel().getMetaModel().oMetadata,
				aKeyFields = oMetaData._getEntityTypeByPath(oEvent.getParameter("item").getKey()).property;

			if (aSelectedItems) {
				for (var i = 0; i < aKeyFields.length; i++) {
					var oJSONItems = {},
						aItems = [],
						oJSONData = {};

					for (var x = 0; x < aSelectedItems.length; x++) {
						var oItem = {},
							sValue = this.getModel().getProperty(aSelectedItems[x].getBindingContextPath())[aKeyFields[i].name];

						if (sValue !== undefined) {
							oItem.key = oItem.text = sValue;
							aItems.push(oItem);
						}
					}

					if (aItems.length > 0) {
						oJSONItems.items = aItems;
						oJSONData[aKeyFields[i].name] = oJSONItems;
					}
				}
			}

			this._smartFilterJSONData = oJSONData;
		},

		onInitSmartFilterBar: function (oEvent) {
			if (this._smartFilterJSONData !== undefined) {
				//Data will be updated with existing data in the SmartFilter
				this.byId("idSmartFilterBar").setFilterData(this._smartFilterJSONData);
				this._smartFilterJSONData = undefined;
			}
		},

		onExportPDF: function (oEvent) {
			// Generate Document Definition JSON
			var oDocDef = {},
				oDocContent = {},
				oDocTable = {},
				oDocTableHeader = {};
			var aDocContent = [],
				aDocTable = [],
				aDocTableBody = [],
				aDocTableHeader = [],
				aDocTableContent = [],
				aDocTableWidth = [];
			var oDate,
				oObject,
				sLabel,
				sPageOrientation = 'portrait';

			//Get current CDS table metadata
			var oMetaData = this.getView().getModel().getMetaModel().oMetadata;
			var aProperty = oMetaData._getEntityTypeByPath(this._sCDS).property;
			var aTableItems = this.byId("idSmartTable").getTable().getItems();
			var sDocTitle;

			//Populate PDF title

			oDocContent.text = this._sTableName;
			oDocContent.style = "header";

			aDocContent.push(oDocContent);

			//Populate PDF subtitle

			oDocContent = {};
			oDocContent = {
				text: this._sTableDescription,
				fontSize: 14,
				bold: true,
				margin: [0, 20, 0, 8]

			};

			aDocContent.push(oDocContent);

			//Populate the style and table
			oDocContent = {};
			oDocContent.style = "tableStyle";
			oDocContent.layout = "lightHorizontalLines";
			oDocTable.headerRows = 1;
			//Populate the Table Header
			for (var i = 0; i < aProperty.length; i++) {
				oDocTableHeader = {};
				sLabel = undefined;
				for (var x = 0; x < aProperty[i].extensions.length; x++) {
					if (aProperty[i].extensions[x].name === "label") {
						sLabel = aProperty[i].extensions[x].value;
						break;
					}
				}

				if (!sLabel) {
					sLabel = aProperty[i].name;
				}

				oDocTableHeader.text = sLabel;
				oDocTableHeader.style = "tableHeader";

				aDocTableHeader.push(oDocTableHeader);

				aDocTableWidth.push('auto');
			}

			aDocTableBody.push(aDocTableHeader);

			//Define page definition, if more than 6 rows, set landscape
			if (aDocTableHeader.length > 6) {
				sPageOrientation = 'landscape';
			}

			//Populate the Table Values
			for (var i = 0; i < aTableItems.length; i++) {
				for (var x = 0; x < aProperty.length; x++) {
					oObject = {};
					oObject = this.getModel().getProperty(aTableItems[i].getBindingContextPath())[aProperty[x].name];
					if (typeof oObject === "object") {
						//Date field not parsed, if date field, parse it
						oDate = Date.parse(oObject);
						if (!isNaN(oDate)) {
							aDocTableContent.push(formatter.convertDate(oObject));
						} else if (oObject.__edmType === "Edm.Time") {
							aDocTableContent.push(formatter.convertMStoTime(oObject.ms));
						} else {
							aDocTableContent.push(this.getModel().getProperty(aTableItems[i].getBindingContextPath())[aProperty[x].name]);
						}
					} else {
						aDocTableContent.push(this.getModel().getProperty(aTableItems[i].getBindingContextPath())[aProperty[x].name]);
					}
				}

				aDocTableBody.push(aDocTableContent);
				aDocTableContent = [];
			}
			oDocTable.body = aDocTableBody;

			oDocContent.table = oDocTable;
			oDocContent.table.widths = aDocTableWidth;

			aDocContent.push(oDocContent);

			oDocDef.content = aDocContent;

			oDocDef.styles = {
				header: {
					fontSize: 18,

					bold: true,

					margin: [0, 0, 0, 10]

				},

				subheader: {
					fontSize: 16,
					bold: true,
					margin: [0, 10, 0, 5]
				},

				tableStyle: {
					margin: [0, 5, 0, 15]
				},
				tableHeader: {
					bold: true,
					fontSize: 10,
					color: "black"
				}
			};

			oDocDef.defaultStyle = {
				fontSize: 9
			};

			oDocDef.pageOrientation = sPageOrientation;

			// Generate and download PDF
			sDocTitle = "Export_" + this._sTableName + ".pdf";
			pdfMake.createPdf(oDocDef).download(sDocTitle);
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
				title: this.getResourceBundle().getText("title"),
				tableName: "",
				addDeleteEnabled: false,
				objLinkActionEnabled: false,
				headerExpanded: true
			});
		},

		/**
		 * Show form fragment in the content
		 * @private
		 * @param {string} sCDS CDS
		 */
		_showFormFragment: function (sCDS) {
			var oVBoxHeader = this.byId("idVBoxHeader"),
				oVBoxContent = this.byId("idVBoxContent");

			if (this._oPageHeaderFragment) {
				this._oPageHeaderFragment.destroy();
			}

			if (this._oPageContentFragment) {
				this._oPageContentFragment.destroy();
			}

			this._oPageHeaderFragment = sap.ui.xmlfragment(this.getView().getId(), "com.rizing.tableit.view.fragment.PageHeader",
				this);
			this._oPageContentFragment = sap.ui.xmlfragment(this.getView().getId(), "com.rizing.tableit.view.fragment.PageContent",
				this);

			this.getView().addDependent(this._oPageHeaderFragment);
			this.getView().addDependent(this._oPageContentFragment);

			oVBoxHeader.removeAllItems();
			oVBoxHeader.addItem(this._oPageHeaderFragment);

			oVBoxContent.removeAllItems();
			oVBoxContent.addItem(this._oPageContentFragment);

			this.byId("idSmartTable").setEntitySet(sCDS);
			this.byId("idSmartFilterBar").setEntitySet(sCDS);
		},

		/**
		 * Check relation of parent and child table
		 * @private
		 * @param {string} sTableName Table name
		 */
		_checkRelation: function (sTableName) {
			this.getModel().read("/ZRZ_C_TABLEREL", {
				filters: [new sap.ui.model.Filter("TableName", sap.ui.model.FilterOperator.EQ, sTableName)],
				success: function (oData) {
					if (oData.results.length === 0) {
						this.getModel("mainView").setProperty("/objLinkActionEnabled", false);
					} else {
						this.getModel("mainView").setProperty("/objLinkActionEnabled", true);

						var oMenu = this.byId("idMenu");

						oMenu.removeAllItems();

						if (oMenu) {
							for (var i = 0; i < oData.results.length; i++) {
								oMenu.addItem(new sap.m.MenuItem({
									key: oData.results[i].CDS,
									text: this.getResourceBundle().getText("maintain", [oData.results[i].Description]),
									icon: oData.results[i].Relationship === "R" ? "sap-icon://arrow-top" : "sap-icon://arrow-bottom"
								}));
							}
						}
					}
				}.bind(this)
			});
		},

		/**
		 * Read master table
		 * @private
		 * @param {array} aFilters Filters
		 * @returns {Promise} Data from OData call
		 */
		_readMasterTable: function (aFilters) {
			return new Promise(function (resolve) {
				this.getModel().read("/ZRZ_C_Table", {
					filters: aFilters,
					success: function (oData) {
						resolve(oData);
					}
				});
			}.bind(this));
		},

		/**
		 * Event handler before rebinding the smarttable.
		 * @param {sap.ui.base.Event} oEvent The smarttable beforeRebindTable event.
		 * @public
		 */
		onBeforeRebindTable: function (oEvent) {
			var oBindingParams = oEvent.getParameter("bindingParams"),
				sQuery = this.byId("idSmartFilterBar").getBasicSearchValue(),
				aSearchFields = [
					"TableName",
					"Description"
				];

			if (sQuery) {
				if (this.getFiltersFromQuery(sQuery, aSearchFields)) {
					oBindingParams.filters.push(this.getFiltersFromQuery(sQuery, aSearchFields));
				}
			}
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent Pattern match event in route 'object'.
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			this._sCDS = oEvent.getParameter("arguments").cds;
			this._sTableName = oEvent.getParameter("arguments").sTableName;
			this._sTableDescription = oEvent.getParameter("arguments").sDescription;

			// 	this._sCDS = oBindingContext.getProperty("CDS");
			// this._sTableName = oBindingContext.getProperty("TableName");
			// this._sTableDescription = oBindingContext.getProperty("Description");

			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("ZRZ_C_TABLEREL", {
					CDS: this._sCDS,
					TableName: this._sTableName
				});
				this._bindView("/" + sObjectPath);
				
				this.onOkTableSelect();
			}.bind(this));
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath Path to the object to be bound.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			var oViewModel = this.getModel("mainView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.metadataLoaded().then(function () {
							
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							// oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						// oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		/**
		 * Binding change.
		 * @private
		 */
		_onBindingChange: function () {
			var oView = this.getView(),
				oViewModel = this.getModel("mainView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.CDS,
				sObjectName = oObject.CDS;

			oViewModel.setProperty("/busy", false);
			// Add the object page to the flp routing history
			// this.addHistoryEntry({
			// 	title: this.getResourceBundle().getText("objectTitle") + " - " + sObjectName,
			// 	icon: "sap-icon://enter-more",
			// 	intent: "#DeliverGoods-display&/DetailHeaders/" + sObjectId
			// });

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [sObjectName]));
		}

	});

});