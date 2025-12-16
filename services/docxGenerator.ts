import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from "docx";
import saveAs from "file-saver";
import { DiaryEntry, PatientData } from "../types";
import { formatDate } from "../utils/helpers";

const PT_10 = 20; // half-points
const PT_11 = 22;
const PT_12 = 24;
const PT_14 = 28;

// Helper to create a signature line
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
                text: "\t\t___________________",
                font: "Times New Roman",
                size: PT_11,
            }),
        ],
        tabStops: [
            {
                type: "right",
                position: 9000, 
            },
        ],
        spacing: { before: 200, after: 200 },
    });
};

const createEntryBlock = (entry: DiaryEntry, patientName: string, doctorName: string, headOfDeptName: string) => {
    const blocks: Paragraph[] = [];

    // Header: "Осмотр лечащего врача" or "Осмотр лечащего врача с зав отделением"
    let title = "Осмотр лечащего врача";
    if (entry.isHeadOfDeptInspection) {
        title = "Осмотр лечащего врача с заведующим отделением";
    }

    blocks.push(
        new Paragraph({
            text: title,
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 }, // Increased spacing before entry
            heading: "Heading3",
            run: {
                font: "Times New Roman",
                bold: true,
                size: PT_12,
                allCaps: true, // Make header CAPS
            }
        })
    );

    // Metadata Line: Name, Date, Time
    blocks.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Дата: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: formatDate(entry.date), font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: "\tВремя: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: entry.time, font: "Times New Roman", size: PT_11 }),
            ],
            tabStops: [
                { type: "left", position: 3000 },
            ],
            spacing: { after: 120 },
        })
    );

    // Complaints
    blocks.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Жалобы: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: entry.complaints, font: "Times New Roman", size: PT_11 }),
            ],
            spacing: { after: 60 },
        })
    );

    // Objective Status (with embedded vitals)
    const vitalsString = `ЧД: ${entry.respiratoryRate}/мин. Пульс: ${entry.heartRate}/мин. АД: ${entry.bloodPressure} мм.рт.ст. t: ${entry.temperature}°C.`;
    const finalObjectiveStatus = `${entry.objectiveStatus} ${vitalsString}`;

    blocks.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Объективно: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: finalObjectiveStatus, font: "Times New Roman", size: PT_11 }),
            ],
            spacing: { after: 60 },
        })
    );

    // Local Status
    blocks.push(
        new Paragraph({
            children: [
                new TextRun({ text: "St. localis: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: entry.localStatus, font: "Times New Roman", size: PT_11 }),
            ],
            spacing: { after: 60 },
        })
    );

    // Recommendations
    blocks.push(
        new Paragraph({
            children: [
                new TextRun({ text: "Назначения: ", bold: true, font: "Times New Roman", size: PT_11 }),
                new TextRun({ text: entry.recommendations, font: "Times New Roman", size: PT_11 }),
            ],
            spacing: { after: 120 },
        })
    );

    // Signatures
    blocks.push(createSignatureLine("Лечащий врач", doctorName));
    if (entry.isHeadOfDeptInspection) {
        blocks.push(createSignatureLine("Зав. отделением", headOfDeptName));
    }
    
    // Separator line (optional, but good for visual separation if printed continuously)
    blocks.push(
         new Paragraph({
            text: " ",
            border: {
                bottom: {
                    color: "E0E0E0",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                },
            },
            spacing: { after: 100 },
        })
    );

    return blocks;
};

export const generateDocx = async (data: PatientData, entries: DiaryEntry[]) => {
    const docChildren: any[] = [];
    
    // Add Main Title
    docChildren.push(
        new Paragraph({
            text: `ДНЕВНИКИ НАБЛЮДЕНИЯ`,
            alignment: AlignmentType.CENTER,
            heading: "Heading1",
            spacing: { after: 200 },
            run: {
                font: "Times New Roman",
                bold: true,
                size: PT_14,
            }
        }),
        new Paragraph({
             text: `Пациент: ${data.fullName}`,
             alignment: AlignmentType.CENTER,
             spacing: { after: 100 },
             run: { font: "Times New Roman", size: PT_12, bold: true }
        }),
        new Paragraph({
             text: `Диагноз: ${data.diagnosis}`,
             alignment: AlignmentType.CENTER,
             spacing: { after: 400 },
             run: { font: "Times New Roman", size: PT_11, italics: true }
        })
    );
    
    let weekendBuffer: DiaryEntry[] = [];

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        
        // Inject Diagnosis into entry for the helper function
        (entry as any).diagnosis = data.diagnosis;

        if (entry.isWeekend) {
            weekendBuffer.push(entry);
            // Check if next day is also weekend
            const nextEntry = entries[i + 1];
            
            // If next entry is NOT weekend or doesn't exist, flush the buffer
            if (!nextEntry || !nextEntry.isWeekend) {
                // Determine date range text
                let dateText = "";
                if (weekendBuffer.length === 1) {
                    dateText = formatDate(weekendBuffer[0].date);
                } else {
                    const first = new Date(weekendBuffer[0].date);
                    const last = new Date(weekendBuffer[weekendBuffer.length - 1].date);
                    const firstDay = first.getDate().toString().padStart(2, '0');
                    const lastDay = last.getDate().toString().padStart(2, '0');
                    const month = (first.getMonth() + 1).toString().padStart(2, '0');
                    const year = first.getFullYear();
                    dateText = `${firstDay}-${lastDay}.${month}.${year}`;
                }

                docChildren.push(
                    new Paragraph({
                        text: `${dateText} – Выходные дни. Пациент под наблюдением дежурного персонала. Состояние стабильное. Жалоб нет. Гемодинамика стабильная.`,
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 200, after: 200 },
                        run: {
                            font: "Times New Roman",
                            size: PT_11,
                            italics: true
                        },
                         border: {
                            bottom: {
                                color: "E0E0E0",
                                space: 1,
                                style: BorderStyle.SINGLE,
                                size: 6,
                            },
                        },
                    })
                );
                weekendBuffer = [];
            }
        } else {
            // Regular Day or Surgery Day
            docChildren.push(...createEntryBlock(entry, data.fullName, data.doctorName, data.headOfDeptName));
        }
    }

    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 567, // ~1cm
                            right: 567,
                            bottom: 567,
                            left: 1134, // ~2cm margin left usually for binding
                        },
                    },
                },
                children: docChildren,
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Дневник_${data.fullName.replace(/\s+/g, '_')}.docx`);
};