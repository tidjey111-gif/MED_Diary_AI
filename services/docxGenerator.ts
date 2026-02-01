import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, Header, Footer, PageNumber, NumberFormat } from "docx";
import saveAs from "file-saver";
import { DiaryEntry, PatientData } from "../types";
import { formatDate } from "../utils/helpers";

const PT_11 = 22;
const PT_12 = 24;
const PT_14 = 28;
const COLOR_BLUE = "2E74B5";

/**
 * Удаляет из текста упоминания АД, ЧСС и других показателей, 
 * чтобы избежать дублирования с программно вставленными данными.
 */
const cleanMedicalText = (text: string): string => {
    // FIX: Escaped forward slashes in regex to prevent parsing errors that affect subsequent lines
    const patterns = [
        /(АД|ЧСС|ЧД|Пульс|Температура|t:)\s*[:]?\s*\d+([.,\/]\d+)?\s*(мм\.?рт\.?ст\.?|уд\/?мин\.?|°C|\/мин)?/gi,
        /\d{2,3}\/\d{2,3}\s*мм\s*рт\s*ст/gi,
        /ЧСС\s*\d+/gi,
        /пульс\s*\d+/gi
    ];
    let cleaned = text;
    patterns.forEach(p => {
        cleaned = cleaned.replace(p, '');
    });
    return cleaned.replace(/\s\s+/g, ' ').trim().replace(/[.,]\s*[.,]/g, '.');
};

const createSignatureLine = (label: string, name: string) => {
    return new Paragraph({
        children: [
            new TextRun({
                text: `${label}: ${name}`,
                bold: true,
                font: "Times New Roman",
                size: PT_11,
            }),
            new TextRun({
                text: "___________________",
                font: "Times New Roman",
                size: PT_11,
            }),
        ],
        alignment: AlignmentType.BOTH,
        spacing: { before: 120, after: 120 },
    });
};

const createEntryBlock = (entry: DiaryEntry, doctorName: string, headOfDeptName: string) => {
    const blocks: Paragraph[] = [];
    const color = COLOR_BLUE;

    let title = entry.isHeadOfDeptInspection 
        ? "Осмотр лечащего врача с заведующим отделением" 
        : "Осмотр лечащего врача";

    blocks.push(
        new Paragraph({
            text: title,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 120 },
            run: {
                font: "Times New Roman",
                size: PT_12,
                color: color,
            }
        })
    );

    blocks.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Дата: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: formatDate(entry.date), font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: " Время: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: entry.time, font: "Times New Roman", size: PT_11 }),
            ],
            spacing: { after: 120 },
        })
    );

    blocks.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Жалобы: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: cleanMedicalText(entry.complaints), font: "Times New Roman", size: PT_11 }),
            ],
            spacing: { after: 60 },
        })
    );

    const vitalsString = `ЧД: ${entry.respiratoryRate}/мин. Пульс: ${entry.heartRate}/мин. АД: ${entry.bloodPressure} мм.рт.ст. t: ${entry.temperature.toFixed(1)}°C.`;
    const cleanedObjective = cleanMedicalText(entry.objectiveStatus);

    blocks.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Объективно: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: `${cleanedObjective}. ${vitalsString}`, font: "Times New Roman", size: PT_11 }),
            ],
            spacing: { after: 60 },
        })
    );

    blocks.push(
        new Paragraph({
            children: [
                new TextRun({ text: "St. localis: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: cleanMedicalText(entry.localStatus), font: "Times New Roman", size: PT_11 }),
            ],
            spacing: { after: 60 },
        })
    );

    blocks.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Назначения: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: cleanMedicalText(entry.recommendations), font: "Times New Roman", size: PT_11 }),
            ],
            spacing: { after: 120 },
        })
    );

    blocks.push(createSignatureLine("Лечащий врач", doctorName));
    if (entry.isHeadOfDeptInspection) {
        blocks.push(createSignatureLine("Зав. отделением", headOfDeptName));
    }
    
    blocks.push(
         new Paragraph({
            border: { bottom: { color: "E0E0E0", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            spacing: { after: 200 },
        })
    );

    return blocks;
};

export const generateDocx = async (data: PatientData, entries: DiaryEntry[]) => {
    const docChildren: any[] = [];
    
    docChildren.push(
        new Paragraph({
            text: `ДНЕВНИКИ НАБЛЮДЕНИЯ`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            run: { font: "Times New Roman", bold: true, size: PT_14, color: COLOR_BLUE }
        }),
        new Paragraph({
             text: `Пациент: ${data.fullName}`,
             alignment: AlignmentType.CENTER,
             run: { font: "Times New Roman", size: PT_11 }
        }),
        new Paragraph({
             text: `Диагноз: ${data.diagnosis}`,
             alignment: AlignmentType.CENTER,
             spacing: { after: 400 },
             run: { font: "Times New Roman", size: PT_11 }
        })
    );
    
    let weekendBuffer: DiaryEntry[] = [];

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry.isWeekend) {
            weekendBuffer.push(entry);
            const nextEntry = entries[i + 1];
            if (!nextEntry || !nextEntry.isWeekend) {
                let dateText = "";
                if (weekendBuffer.length === 1) {
                    dateText = formatDate(weekendBuffer[0].date);
                } else {
                    const first = new Date(weekendBuffer[0].date);
                    const last = new Date(weekendBuffer[weekendBuffer.length - 1].date);
                    dateText = `${first.getDate().toString().padStart(2, '0')}-${last.getDate().toString().padStart(2, '0')}.${(first.getMonth() + 1).toString().padStart(2, '0')}.${first.getFullYear()}`;
                }

                docChildren.push(
                    new Paragraph({
                        text: `${dateText} – Выходные дни. Пациент под наблюдением дежурного персонала. Состояние стабильное. Жалоб нет. Гемодинамика стабильная.`,
                        spacing: { before: 200, after: 200 },
                        run: { font: "Times New Roman", size: PT_11 },
                        border: { bottom: { color: "E0E0E0", style: BorderStyle.SINGLE, size: 6 } },
                    })
                );
                weekendBuffer = [];
            }
        } else {
            docChildren.push(...createEntryBlock(entry, data.doctorName, data.headOfDeptName));
        }
    }

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: { top: 1134, right: 850, bottom: 1134, left: 1700 }, // ~3cm left, 1.5cm right
                    },
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        children: [PageNumber.CURRENT],
                                        font: "Times New Roman",
                                        size: PT_11,
                                    }),
                                ],
                            }),
                        ],
                    }),
                },
                children: docChildren,
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Дневники_${data.fullName.replace(/\s+/g, '_')}.docx`);
};