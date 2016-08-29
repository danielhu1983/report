import { Injectable, EventEmitter } from '@angular/core';
import { ReportingData } from '../Mock-Data/ReportingData';

@Injectable()
export class NotifiMessage {
    RepTSMsg: EventEmitter<any>;
    constructor(){
        this.RepTSMsg = new EventEmitter();
        this.RepTSMsg.subscribe(
            (msg: any) =>{
                this.receiveMessage(msg);
            }
        );
    }

    receiveMessage(message: any){
        console.warn(message.options.dtlID);
        switch(message.options.dtlID){
            case 100:
                var dlg = message.pageContext.service.getSettingDialog();
                message.pageContext.ui.children.push(dlg);
                message.options.modal = "modal";
                message.options.target = "#Report_Setting";
                break;
            case 400:
                if(message.checked === true){
                    var dlg = message.pageContext.service.getSummaryChartUILayout();
                    message.pageContext.ui.children.push(dlg);
                    message.options.modal = "modal";
                    message.options.target = "#portfolio_summary_chart";
                }
                else{
                    message.pageContext.ui.children.pop();
                }
                break;
            case 502:
                message.options.items = ReportingData.getPortfoliolist();
                break;
            case 510:
                message.options.items = ReportingData.getReportingCurrencyList();
                break;
            case 511:
                var naccfee = message.pageContext.service.findControl("accfee");
                naccfee.options.disabled = false;
                break;
            case 512:
                var accfee = message.pageContext.service.findControl("accfee");
                accfee.options.disabled = true;
                break;
            case 520:
                message.options.items = ReportingData.getSecurityType();
                break;
            case 521:
                message.options.items = [];
                var secType = message.pageContext.service.findControl("sectype");
                console.warn(secType.options.items);
                if(secType.options.items === undefined){
                }
                else{
                    console.warn('change sec symbol');
                    if(secType.options.selectedIndex === undefined){
                        secType.options.selectedIndex = 0;
                    }
                    console.warn(secType);
                    let sect: string = secType.options.items[secType.options.selectedIndex].value;
                    message.options.items = ReportingData.getSecuritySymbol(sect);
                }
                break;
            default:
                console.warn(message);
                break;
        }
    }

    sendMessage(message: any){
        this.RepTSMsg.emit(message);
    }
}