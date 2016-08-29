import { ReportingData } from '../Mock-Data/ReportingData';

export function InitInstance(): void{

}

export function LoadReport(argrname: string, repdesc: string): any {
    return ReportingData.getcarJson();
}