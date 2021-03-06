import { Injectable } from '@angular/core';

import { TransporterService } from './transporter.service';

import { RepService } from './rep';
import { Observable } from 'rxjs';

import { AppraisalParm } from '../model/appraisal.parm.model';

import { NotifiMessage } from '../ReportDialogController/NotifiMessage';
import { DialogAdapter } from '../ReportDialogController/ReportingAdapter';

function detectValue(appraisalParm) {
    if (appraisalParm.ParmSectionID === "1") {
        return appraisalParm.DefaultValue;
    } else if (appraisalParm.ParmSectionID === "5") {
        if (appraisalParm.ParmTypeDefaultValue === "0") {
            return false;
        } 
        return true;
    }
    return "";
}

function detectTitle(appraisalParm) {
    if (appraisalParm.IsRequired === "1") {
        return appraisalParm.DisplayName + " *";
    }
    return appraisalParm.DisplayName;
}


@Injectable()
export class ReplangService {

    constructor(private _transporter: TransporterService, private _rep: RepService, private _notify: NotifiMessage) {
    }

    public ssrsData: any;

    public getDialogData(dialogType: string): Object {
        if (dialogType === "summary") {
            return this._transporter.getSummaryData();
        } else if (dialogType == "reorg") {
            return this._transporter.getReorgData();
        }
    }

    public getSSRSData(): any {
        this._transporter.getSSRSData().subscribe((res: any) => {
            this.ssrsData = res;
        });
    }


    public getSummaryConfirmation(): string {
        this._rep.getSecuritySymbolsByType("rockets");
        let result: string = "";
        this._rep.securitySymbols().subscribe((res: any) => {
            result = res;
        });
        return result;
        //return "Prices are not avaliable for 12/31/2016. Do you wish to continue to run this report ?";
    }

    public getSSRSReportUILayout(isDialog: boolean): Object {
        let ssrs: any = this.ssrsData;
        console.warn(ssrs);
        let bodys = [];
        let section1forms1: Array<any> = [];
        let section1forms2: Array<any> = [];
        let section2forms1: Array<any> = [];
        let section2forms2: Array<any> = [];
        let section1Parm: Array<AppraisalParm> = [];
        let section2Parm: Array<AppraisalParm> = [];

        if(!ssrs.ParmDisplay) return;

        let ui: any;
        if (isDialog) {
            ui = {
                type: "myDialog",
                options: {
                    id: "ssrs_report",
                    dialogId: "ssrs_report",
                    title: ssrs.ParmDisplay.SSRSReport.DisplayName,
                    body: [
                        {
                            type: "myDialogBody",
                            options: {
                                children: bodys
                            }
                        }
                    ]
                }
            }
        } else {
            ui = {
                children: [
                    {
                        type: "mySection",
                        options: {
                            klass: "section-ssrs",
                            children: bodys
                        }
                    }
                ]
            }
        }


        let header = {
            type: "mySpan",
            options: {
                children: [
                    {
                        type: "myNavbar",
                        options: {
                            click: function() {
                                if(!isDialog){
                                    window.open("http://localhost:3000/report/-3939;reportType=SSRS", "SSRS");
                                }
                            }
                        }
                    }
                ]
            }
        }

        let section1 = {
            type: "myForm",
            options: {
                klass: "row section-form collapse in",
                id: "portfolio_appraisal",
                formId: "portfolio_appraisal",
                leftChildren: section1forms1,
                rightChildren: section1forms2
            }
        }

        let section2 = {
            type: "myForm",
            options: {
                klass: "row section-form collapse",
                id: "portfolio_settings",
                formId: "portfolio_settings",
                leftChildren: section2forms1,
                rightChildren: section2forms2
            }
        }

        if (ssrs.ParmDisplay.Parameters) {
            let rows: Array<AppraisalParm> = ssrs.ParmDisplay.Parameters.row;
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].ParmSectionID === "1") {
                    section1Parm.push(rows[i]);
                } else if (rows[i].ParmSectionID === "2") {
                    section2Parm.push(rows[i]);
                }
            }
        }

        this.addRowToForm(section1Parm, section1forms1, section1forms2);
        this.addRowToForm(section2Parm, section2forms1, section2forms2);

        bodys.push(header);
        bodys.push(section1);
        bodys.push(section2);
        bodys.push({
            type: "mySection",
            options: {
                isHidden: !isDialog,
                klass: "section-loading-form",
                children: [
                    {
                        type: "mySpinner",
                        options: {
                            isRunning: true
                        }
                    }
                ]
            }
        })

        return ui;
    }

    public pushControls(sectionForms: Array<any>, appraisalParm: AppraisalParm) {
        let formControl: Object = {
            type: "myFormControl",
            options: {
                title: detectTitle(appraisalParm),
                mode: appraisalParm.ParmTypeID,
                value: detectValue(appraisalParm),
                IsRequired: appraisalParm.IsRequired,
                items: [],
                click: function () {

                },
                onchange: function() {

                }
            }
        };
        sectionForms.push(formControl);
    }

    public addRowToForm(sectionRows: Array<AppraisalParm>, sectionForms1: Array<any>, sectionForms2: Array<any>): void {
        let halfLength: number = Math.ceil(sectionRows.length / 2);
        console.info(sectionRows);
        for (let i = 0; i < sectionRows.length; i++) {
            let appraisalParm: AppraisalParm = sectionRows[i];
            if (i < halfLength) {
                this.pushControls(sectionForms1, appraisalParm);
            } else {
               this.pushControls(sectionForms2, appraisalParm);
            }
        }
    }


    public getSummaryReportUILayout(): Object {
        let repDLG = DialogAdapter.getrepJSON('psum','Portfolio summary');
        let that = this;
        return {
            type: "myDialog",
            options: {
                id: "portfolio_summary",
                dialogId: "portfolio_summary",
                title: "Report: Summary",
                body: [
                    {
                        type: "myDialogBody",
                        options: {
                            children: [
                                {
                                    type: "myTitle",
                                    options: {
                                        title: "This report displays portfolio holdings as a selected date, without detailing individual securities." +
                                        "Values include cost basis, market value, percentage of portfolio, yield, and estimated annual income.",
                                        level: 6
                                    }
                                },
                                {
                                    type: "mySection",
                                    options: {
                                        klass: "section",
                                        children: [
                                            {
                                                type: "myFormGroupDropdown",
                                                options: {
                                                    id: "portfolioDropdown",
                                                    label: "Portfolio",
                                                    disabled: false,
                                                    name: "portfolioDropdown",
                                                    dtlID: 502,
                                                    dtilStyle: 268438400,
                                                    dialog: "dialog",
                                                    click: function (context) {
                                                        that._notify.sendMessage(context);
                                                        //var portfolio = context.pageContext.service.findControl("portfolioDropdown");
                                                        //portfolio.options.items = context.pageContext.data[1].portfolio;
                                                    },
                                                    onchange: function (value) {
                                                        console.warn(value);
                                                    }

                                                }
                                            },
                                            {
                                                type: "myFormGroupDropdown",
                                                options: {
                                                    id: "currencyDropdown",
                                                    label: "Reporting Currency",
                                                    disabled: false,
                                                    name: "currencyDropdown",
                                                    dtlID: 510,
                                                    dtilStyle: 268438144,
                                                    dialog: "dialog",
                                                    click: function (context) {
                                                        that._notify.sendMessage(context);
                                                        //var portfolio = context.pageContext.service.findControl("portfolioDropdown");
                                                        //console.warn(portfolio.options.selectedIndex);
                                                        //var currency = context.pageContext.service.findControl("currencyDropdown");
                                                        //currency.options.items = context.pageContext.data[1].currency;
                                                    },
                                                    onchange: function (value) {
                                                        console.warn(value);
                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupDatepicker",
                                                options: {
                                                    label: "Date",
                                                    dialog: "dialog",
                                                }
                                            },
                                            {
                                                type: "myFormGroupCheckbox",
                                                options: {
                                                    label: "Include Unsupervised Assets",
                                                    value: "icu",
                                                    disabled: false,
                                                    click: function (context) {

                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupCheckbox",
                                                options: {
                                                    id: "chart",
                                                    label: "Chart",
                                                    disabled: false,
                                                    value: "chart",
                                                    dtlID: 400,
                                                    dialog: "dialog",
                                                    click: function (context) {
                                                        context.checked = !context.checked;
                                                        that._notify.sendMessage(context);
                                                        //var chartDialog = context.pageContext.service.getSummaryChartUILayout();
                                                        //context.pageContext.ui.children.push(chartDialog);
                                                        //context.options.modal = "modal";
                                                        //context.options.target = "#portfolio_summary_chart";
                                                    }
                                                }
                                            },
                                            {
                                                type: "myTitle",
                                                options: {
                                                    title: "Calculate Performance",
                                                    name: "calcType",
                                                    level: 6
                                                }
                                            },
                                            {
                                                type: "myFormGroupRadiobutton",
                                                options: {
                                                    id: "netoffee",
                                                    label: "Net of Fee",
                                                    value: "netoffee",
                                                    groupName: "calcType",
                                                    name: "netoffee",
                                                    dtlID: 511,
                                                    dtilStyle: 83886082,
                                                    dialog: "dialog",
                                                    click: function (context) {
                                                        var accfee = context.pageContext.service.findControl("accfee");
                                                        //accfee.options.disabled = true;
                                                        //context.pageContext.children
                                                        that._notify.sendMessage(context);
                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupRadiobutton",
                                                options: {
                                                    id: "grossoffee",
                                                    label: "Gross of Fee",
                                                    value: "grossoffee",
                                                    groupName: "calcType",
                                                    name: "grossoffee",
                                                    dtlID: 512,
                                                    dtilStyle: 83886082,
                                                    dialog: "dialog",
                                                    click: function (context) {
                                                        that._notify.sendMessage(context);
                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupCheckbox",
                                                options: {
                                                    id: "accfee",
                                                    label: "Acc Fee",
                                                    disabled: false,
                                                    value: "accfee",
                                                    name: "accfee",
                                                    dtlID: 511,
                                                    click: function (context) {                                                      
                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupDropdown",
                                                options: {
                                                    id: "sectype",
                                                    label: "Security Type",
                                                    disabled: false,
                                                    name: "sectype",
                                                    dtlID: 520,
                                                    dtilStyle: 268438144,
                                                    dialog: "dialog",
                                                    click: function (context) {
                                                        that._notify.sendMessage(context);
                                                    },
                                                    onchange: function (event) {                                                    
                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupDropdown",
                                                options: {
                                                    id: "secsymbol",
                                                    label: "Security Symbol",
                                                    disabled: false,
                                                    name: "secsymbol",
                                                    dtlID: 521,
                                                    dtilStyle: 268438144,
                                                    dialog: "dialog",
                                                    click: function (context) {
                                                        that._notify.sendMessage(context);  
                                                    },
                                                    onchange: function (event) {

                                                    }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    type: "mySection",
                                    options: {
                                        klass: "section",
                                        children: [
                                            
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ],
                footer: [
                    {
                        type: "myDialogButton",
                        options: {
                            buttonText: "OK",
                            id: "openConfirmDialog",
                            modal: "modal",
                            target: "#portfolio_summary_confirm",
                            dialog: "dialog",
                            click: function (context) {
                                var confirmDialog = context.pageContext.service.getSummaryConfirmUILayout();
                                context.pageContext.ui.children.push(confirmDialog);
                            }
                        }
                    },
                    {
                        type: "myDialogButton",
                        options: {
                            buttonText: "Consolidate",
                            click: function (context) {
                                var portfolio = context.pageContext.service.findControl("portfolioDropdown");
                                if (portfolio.options.items && portfolio.options.items.length > 0) {
                                    var selectedItem = portfolio.options.items[portfolio.options.selectedIndex];
                                    if (selectedItem.consolidated) {
                                        selectedItem.text = selectedItem.text.substring(1);
                                        selectedItem.consolidated = false;
                                    } else {
                                        selectedItem.text = "+" + selectedItem.text;
                                        selectedItem.consolidated = true;
                                    }
                                }
                            }
                        }
                    },
                    {
                        type: "myDialogButton",
                        options: {
                            buttonText: "Browse",
                            click: function (context) {

                            }
                        }
                    },
                    {
                        type: "myDialogButton",
                        options: {
                            buttonText: "Settings",
                            dtlID: 100,
                            dialog: "dialog",
                            click: function (context) {
                                that._notify.sendMessage(context);
                            }
                        }
                    }
                ]
            }
        }
    }

    public getSummaryChartUILayout(): Object {
        let that = this;
        return {
            type: "myDialog",
            options: {
                dialogId: "myportfolio_chart",
                title: "Report: Chart Options",
                body: [
                    {
                        type: "myDialogBody",
                        options: {
                            children: [
                                {
                                    type: "mySection",
                                    options: {
                                        klass: "section-radio",
                                        children: [
                                            {
                                                type: "myTitle",
                                                options: {
                                                    title: "Chart Type",
                                                    level: 5
                                                }
                                            },
                                            {
                                                type: "myFormGroupRadiobutton",
                                                options: {
                                                    id: "pieRadio",
                                                    label: "Pie",
                                                    value: "pie",
                                                    groupName: "chartType",
                                                    dialog: "portfolio_chart",
                                                    click: function (context) {
                                                        that._notify.sendMessage(context);
                                                        var _3d = context.pageContext.service.findControl("3dCheck");
                                                        var _comLables = context.pageContext.service.findControl("labelCheck");
                                                        var _gridLines = context.pageContext.service.findControl("lineCheck");
                                                        _3d.options.disabled = !context.options.checked;
                                                        _comLables.options.disabled = !context.options.checked;
                                                        _gridLines.options.disabled = !context.options.checked;

                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupRadiobutton",
                                                options: {
                                                    id: "barRadio",
                                                    label: "Bar",
                                                    value: "bar",
                                                    groupName: "chartType",
                                                    dialog: "portfolio_chart",
                                                    click: function (context) {

                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupRadiobutton",
                                                options: {
                                                    id: "columnRadio",
                                                    label: "Column",
                                                    value: "column",
                                                    groupName: "chartType",
                                                    dialog: "portfolio_chart",
                                                    click: function (context) {

                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupRadiobutton",
                                                options: {
                                                    id: "lineRadio",
                                                    label: "Line",
                                                    value: "line",
                                                    groupName: "chartType",
                                                    dialog: "portfolio_chart",
                                                    click: function (context) {
                                                        var _3d = context.pageContext.service.findControl("3dCheck");
                                                        var _comLables = context.pageContext.service.findControl("labelCheck");
                                                        var _gridLines = context.pageContext.service.findControl("lineCheck");
                                                        _3d.options.disabled = context.options.checked;
                                                        _comLables.options.disabled = context.options.checked;
                                                        _gridLines.options.disabled = context.options.checked;
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    type: "mySection",
                                    options: {
                                        klass: "section-checkbox",
                                        children: [
                                            {
                                                type: "myTitle",
                                                options: {
                                                    title: "Chart Format",
                                                    level: 5
                                                }
                                            },
                                            {
                                                type: "myFormGroupCheckbox",
                                                options: {
                                                    id: "3dCheck",
                                                    label: "3D",
                                                    value: "3d",
                                                    disabled: false,
                                                    click: function (context) {

                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupCheckbox",
                                                options: {
                                                    id: "labelCheck",
                                                    label: "Combined Labels",
                                                    disabled: false,
                                                    value: "comLabels",
                                                    click: function (context) {

                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupCheckbox",
                                                options: {
                                                    id: "lineCheck",
                                                    label: "Grid Lines",
                                                    disabled: false,
                                                    value: "gridLines",
                                                    click: function (context) {

                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupCheckbox",
                                                options: {
                                                    id: "legendCheck",
                                                    label: "Legend",
                                                    disabled: false,
                                                    value: "legend",
                                                    click: function (context) {

                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupCheckbox",
                                                options: {
                                                    id: "markersCheck",
                                                    label: "Line Markers",
                                                    disabled: false,
                                                    value: "lineMarkers",
                                                    click: function (context) {

                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ],
                footer: [
                    {
                        type: "myDialogButton",
                        options: {
                            buttonText: "OK",
                            dismiss: "modal",
                            click: function (context) {
                                var chart = context.pageContext.service.findControl("chart");

                            }
                        }
                    }
                ]
            }
        }
    }

    public getSummaryConfirmUILayout(): Object {
        return {
            type: "myDialog",
            options: {
                id: "portfolio_summary_confirm",
                dialogId: "portfolio_summary_confirm",
                title: "Report: Confirm",
                body: [
                    {
                        type: "myDialogBody",
                        options: {
                            children: [
                                {
                                    type: "myTitle",
                                    options: {
                                        title: this.getSummaryConfirmation(),
                                        level: 6
                                    }
                                }
                            ]
                        }
                    }
                ],
                footer: [
                    {
                        type: "myDialogButton",
                        options: {
                            buttonText: "OK",
                            modal: "modal",
                            target: "#portfolio_summary_chart_categories",
                            click: function (context) {
                                var confirmDialog = context.pageContext.service.findControl("portfolio_summary_confirm");
                                ($("#" + confirmDialog.options.dialogId) as any).modal("hide");
                                var summaryDialog = context.pageContext.service.findControl("portfolio_summary");
                                ($("#" + summaryDialog.options.dialogId) as any).modal("hide");
                                var chartCategoriesDialog = context.pageContext.service.getSummaryChartCategoriesUILayout();
                                context.pageContext.ui.children.push(chartCategoriesDialog);
                            }
                        }
                    }
                ]
            }
        }
    }

    public getSummaryChartCategoriesUILayout(): Object {
        return {
            type: "myDialog",
            options: {
                dialogId: "portfolio_summary_chart_categories",
                title: "Report: Summary",
                body: [
                    {
                        type: "myDialogBody",
                        options: {
                            children: [
                                {
                                    type: "myTitle",
                                    options: {
                                        title: "A graph can be created based on the following categories:",
                                        level: 6
                                    }
                                },
                                {
                                    type: "mySection",
                                    options: {
                                        klass: "section-radio-margin",
                                        children: [
                                            {
                                                type: "myTitle",
                                                options: {
                                                    title: "Chart Categories",
                                                    level: 5
                                                }
                                            },
                                            {
                                                type: "myFormGroupRadiobutton",
                                                options: {
                                                    id: "assetClasses",
                                                    label: "Asset Classes",
                                                    value: "assetClasses",
                                                    groupName: "chartCategories",
                                                    click: function (context) {

                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupRadiobutton",
                                                options: {
                                                    id: "industryGroups",
                                                    label: "Industry Groups",
                                                    value: "industryGroups",
                                                    groupName: "chartCategories",
                                                    click: function (context) {

                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupRadiobutton",
                                                options: {
                                                    id: "industrySectors",
                                                    label: "Industry Sectors",
                                                    value: "industrySectors",
                                                    groupName: "chartCategories",
                                                    click: function (context) {

                                                    }
                                                }
                                            },
                                            {
                                                type: "myFormGroupRadiobutton",
                                                options: {
                                                    id: "securityTypes",
                                                    label: "Security Types",
                                                    value: "securityTypes",
                                                    groupName: "chartCategories",
                                                    click: function (context) {

                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ],
                footer: [
                    {
                        type: "myDialogButton",
                        options: {
                            buttonText: "OK",
                            dismiss: "modal",
                            click: function (context) {
                                window.open("http://localhost:3000/report/-3939;reportType=Portfolio", "Portfolio");
                            }
                        }
                    },
                    {
                        type: "myDialogButton",
                        options: {
                            buttonText: "Help",
                            click: function (context) {

                            }
                        }
                    }
                ]
            }
        }
    }

    public getSettingDialog(): Object{
        let that = this;
        return{
            type: "myDialog",
            options:{
                dialogId: "Report_Setting",
                title: "Settings",
                modal: "modal",
                target: "#Report_Setting",
                body: [
                    {
                        type: "myDialogBody",
                        options: {
                            children:[{
                                type: "mySection",
                                options: {
                                    klass: "section",
                                    children: [
                                        {                                    
                                            type: "myFormGroupDropdown",
                                            options: {
                                                id: "MBS",
                                                label: "MBS",
                                                disabled: false,
                                                name: "MBS",
                                                dtlID: 600,
                                                dtilStyle: 268438144,
                                                dialog: "Report_Setting",
                                                click: function (context) {
                                                    that._notify.sendMessage(context);
                                                },
                                                onchange: function (event) {
                                                }
                                            }
                                    },
                                    {
                                        type: "myFormGroupDropdown",
                                        options: {
                                            id: "TIPS",
                                            label: "TIPS",
                                            disabled: false,
                                            name: "TIPS",
                                            dtlID: 601,
                                            dtilStyle: 268438144,
                                            dialog: "Report_Setting",
                                            click: function (context) {
                                                that._notify.sendMessage(context);
                                            },
                                            onchange: function (event) {
                                            }
                                        }
                                    },
                                    {
                                        type: "myFormGroupCheckbox",
                                        options: {
                                            label: "Override portfolio settings",
                                            value: "icu",
                                            dtlID: 500,
                                            dialog: "Report_Setting",
                                            disabled: false,
                                            click: function (context) {
                                            }
                                        }
                                    }
                                ]
                            }
                            }]
                    }
                }    
                ],
                footer:[  
                    {
                        type: "myDialogButton",//myDialogButton
                        options: {
                            buttonText: "OK",
                            dialog: "Report_Setting",
                            click: function (context) {

                            }
                        }
                    }
                ]
            }
        };
    }

}






/* export class SampleViewComponent {
    public isRequesting: boolean;
    public items: Array<any>;

    constructor(private apiService: ApiService) {
        this.refresh();
    }

    public refresh(): void {
        this.isRequesting = true;
        this.apiService.sampleHttpGetRequest()
            .subscribe(
            result => this.items = result,
            () => this.stopRefreshing(),
            () => this.stopRefreshing());
    }

    private stopRefreshing() {
        this.isRequesting = false;
    }
} */