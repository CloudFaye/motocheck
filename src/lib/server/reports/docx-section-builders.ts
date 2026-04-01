/**
 * Improved DOCX Section Builders
 * Carfax-inspired professional design for Word documents
 */

import {
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  VerticalAlign,
  ImageRun,
  ShadingType
} from 'docx';
import type {
  ComprehensiveVehicleData,
  ImageResult,
  OwnershipHistory,
  SaleHistory,
  OdometerHistory,
  TitleHistory,
  InspectionHistory,
  InsuranceHistory,
  JunkSalvageInfo,
  AccidentHistory,
  LienImpoundHistory,
  TheftHistory,
  TitleBrands,
  MarketValue,
  WarrantyInfo
} from '../vehicle/types';
import { DOCX_STYLES, TABLE_BORDERS } from './docx-styles';
import type { ReportGenerationOptions } from './docx-generator';

// ===== Helper Functions =====

/**
 * Create a section header with icon
 */
function createSectionHeader(title: string, icon: string): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `${icon} `,
          font: DOCX_STYLES.fonts.body,
          size: 28
        }),
        new TextRun({
          text: title,
          font: DOCX_STYLES.fonts.heading,
          size: 28,
          bold: true,
          color: DOCX_STYLES.colors.text
        })
      ],
      spacing: { before: 400, after: 200 },
      border: {
        bottom: {
          color: DOCX_STYLES.colors.primary,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 12
        }
      }
    })
  ];
}

/**
 * Create a status badge
 */
function createStatusBadge(text: string, type: 'success' | 'warning' | 'error' | 'info'): TextRun[] {
  const colors = {
    success: { bg: DOCX_STYLES.colors.successBg, text: '065F46' },
    warning: { bg: DOCX_STYLES.colors.warningBg, text: '92400E' },
    error: { bg: DOCX_STYLES.colors.errorBg, text: '991B1B' },
    info: { bg: DOCX_STYLES.colors.infoBg, text: '1E40AF' }
  };
  
  const color = colors[type];
  
  return [
    new TextRun({
      text: '  ',
      font: DOCX_STYLES.fonts.body,
      size: 20
    }),
    new TextRun({
      text: text,
      font: DOCX_STYLES.fonts.body,
      size: 18,
      bold: true,
      color: color.text,
      shading: {
        type: ShadingType.CLEAR,
        fill: color.bg
      }
    }),
    new TextRun({
      text: '  ',
      font: DOCX_STYLES.fonts.body,
      size: 20
    })
  ];
}

/**
 * Build a DOCX section with title and content
 */
export function buildDOCXSection(
  title: string,
  content: (Paragraph | Table)[]
): (Paragraph | Table)[] {
  return [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: {
        before: DOCX_STYLES.spacing.sectionBefore,
        after: DOCX_STYLES.spacing.sectionAfter
      },
      run: {
        font: DOCX_STYLES.fonts.heading,
        size: 28,
        bold: true,
        color: DOCX_STYLES.colors.text
      }
    }),
    ...content
  ];
}

/**
 * Create a formatted DOCX table with professional styling
 */
export function createDOCXTable(
  headers: string[],
  rows: string[][]
): Table {
  const columnCount = headers.length;
  const columnWidthPercent = Math.floor(100 / columnCount);

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows: [
      // Header row with primary color background
      new TableRow({
        children: headers.map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: header,
                      font: DOCX_STYLES.fonts.body,
                      size: 20,
                      bold: true,
                      color: DOCX_STYLES.colors.white
                    })
                  ]
                })
              ],
              width: {
                size: columnWidthPercent,
                type: WidthType.PERCENTAGE
              },
              shading: {
                fill: DOCX_STYLES.colors.primary
              },
              margins: {
                top: 100,
                bottom: 100,
                left: 100,
                right: 100
              },
              verticalAlign: VerticalAlign.CENTER
            })
        ),
        tableHeader: true
      }),
      // Data rows with alternating colors
      ...rows.map(
        (row, index) =>
          new TableRow({
            children: row.map(
              (cell, cellIndex) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cell || 'N/A',
                          font: cellIndex === 0 ? DOCX_STYLES.fonts.body : DOCX_STYLES.fonts.body,
                          size: 22,
                          bold: cellIndex === 0,
                          color: cellIndex === 0 ? DOCX_STYLES.colors.textSecondary : DOCX_STYLES.colors.text
                        })
                      ]
                    })
                  ],
                  width: {
                    size: columnWidthPercent,
                    type: WidthType.PERCENTAGE
                  },
                  shading: {
                    fill: index % 2 === 0 ? DOCX_STYLES.colors.backgroundAlternate : DOCX_STYLES.colors.white
                  },
                  margins: {
                    top: 80,
                    bottom: 80,
                    left: 100,
                    right: 100
                  },
                  verticalAlign: VerticalAlign.CENTER
                })
            )
          })
      )
    ],
    borders: TABLE_BORDERS
  });
}

/**
 * Build empty section placeholder
 */
export function buildEmptySectionDOCX(title: string, icon: string = '📋'): (Paragraph | Table)[] {
  return [
    ...createSectionHeader(title, icon),
    new Paragraph({
      children: [
        new TextRun({
          text: '📋',
          font: DOCX_STYLES.fonts.body,
          size: 48
        })
      ],
      spacing: { before: 400, after: 200 },
      alignment: AlignmentType.CENTER
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Data Not Available',
          font: DOCX_STYLES.fonts.body,
          size: 24,
          bold: true,
          color: DOCX_STYLES.colors.textSecondary
        })
      ],
      spacing: { before: 200, after: 100 },
      alignment: AlignmentType.CENTER
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'This information will be displayed when available from our data sources',
          font: DOCX_STYLES.fonts.body,
          size: 20,
          color: DOCX_STYLES.colors.textLight,
          italics: true
        })
      ],
      spacing: { after: 400 },
      alignment: AlignmentType.CENTER
    })
  ];
}

/**
 * Embed image safely with timeout
 */
export async function embedImageSafely(
  imageUrl: string,
  maxWidth: number = 576
): Promise<ImageRun | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MotoCheck-Report-Generator/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('Image too large (>5MB)');
    }

    const width = maxWidth;
    const height = Math.round(maxWidth * 0.75);

    return new ImageRun({
      data: buffer,
      transformation: {
        width,
        height
      },
      type: 'png'
    });
  } catch (error) {
    console.warn(`Failed to embed image from ${imageUrl}:`, error);
    return null;
  }
}

// ===== Key Highlights Section (Carfax-inspired) =====

/**
 * Build Key Highlights section with 4-card grid
 * 
 * Displays at-a-glance vehicle assessment with:
 * - Previous Owners count
 * - Accidents Reported count
 * - Open Recalls count
 * - Theft Record status
 */
export function buildKeyHighlightsSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
  const content: Paragraph[] = [];

  // Section title
  content.push(
    ...createSectionHeader('Key Highlights', '📊')
  );

  // Calculate highlight values
  const ownersCount = data.ownership?.numberOfOwners || 0;
  const accidentsCount = data.accidents?.totalAccidents || 0;
  const recallsCount = data.recalls?.length || 0;
  const isStolen = data.theft?.isStolen || false;

  // Create 4-card grid using table
  const highlightCards = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Row 1: Icons
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: '🚗', alignment: AlignmentType.CENTER })],
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({ text: '⚠️', alignment: AlignmentType.CENTER })],
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({ text: '🔧', alignment: AlignmentType.CENTER })],
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({ text: '🔒', alignment: AlignmentType.CENTER })],
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          })
        ]
      }),
      // Row 2: Numbers
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: ownersCount.toString(), size: 48, bold: true, color: DOCX_STYLES.colors.primary })],
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: accidentsCount.toString(), size: 48, bold: true, color: DOCX_STYLES.colors.primary })],
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: recallsCount.toString(), size: 48, bold: true, color: DOCX_STYLES.colors.primary })],
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: isStolen ? 'STOLEN' : 'No', size: 48, bold: true, color: isStolen ? DOCX_STYLES.colors.error : DOCX_STYLES.colors.primary })],
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          })
        ]
      }),
      // Row 3: Labels
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Previous Owners', alignment: AlignmentType.CENTER })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Accidents Reported', alignment: AlignmentType.CENTER })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Open Recalls', alignment: AlignmentType.CENTER })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({ text: 'Theft Record', alignment: AlignmentType.CENTER })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          })
        ]
      }),
      // Row 4: Status Badges
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: createBadge(ownersCount <= 2 ? '✓ Clean' : ownersCount <= 4 ? '⚠ Multiple' : '⚠ Many', ownersCount <= 2 ? 'success' : 'warning'),
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({
              children: createBadge(accidentsCount === 0 ? '✓ No Accidents' : accidentsCount === 1 ? '⚠ 1 Accident' : '⚠ Multiple', accidentsCount === 0 ? 'success' : 'warning'),
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({
              children: createBadge(recallsCount === 0 ? '✓ No Recalls' : '⚠ Check Recalls', recallsCount === 0 ? 'success' : 'warning'),
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          }),
          new TableCell({
            children: [new Paragraph({
              children: createBadge(isStolen ? '⛔ STOLEN' : '✓ Clean', isStolen ? 'error' : 'success'),
              alignment: AlignmentType.CENTER
            })],
            shading: { fill: DOCX_STYLES.colors.backgroundLight },
            borders: TABLE_BORDERS
          })
        ]
      })
    ]
  });

  content.push(highlightCards);

  return content;
}

// ===== Vehicle Images Section =====

export async function buildVehicleImagesSection(images: ImageResult[]): Promise<(Paragraph | Table)[]> {
  if (!images || images.length === 0) {
    return buildEmptySectionDOCX('Vehicle Images', '📷');
  }

  const displayImages = images.slice(0, 4);
  const content: Paragraph[] = [];

  for (const img of displayImages) {
    try {
      const imageRun = await embedImageSafely(img.url, 576);

      if (imageRun) {
        content.push(
          new Paragraph({
            children: [imageRun],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 }
          })
        );

        const captionParts: string[] = [];
        captionParts.push(`Source: ${img.source}`);
        captionParts.push(`Match: ${img.matchType}`);
        if (img.metadata.date) {
          captionParts.push(`Date: ${img.metadata.date}`);
        }

        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: captionParts.join(' | '),
                font: DOCX_STYLES.fonts.body,
                size: 18,
                color: DOCX_STYLES.colors.textLight,
                italics: true
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          })
        );
      }
    } catch (error) {
      console.warn(`Failed to process image from ${img.source}:`, error);
    }
  }

  if (content.length === 0) {
    return buildEmptySectionDOCX('Vehicle Images', '📷');
  }

  return [...createSectionHeader('Vehicle Images', '📷'), ...content];
}

// ===== Vehicle Specifications Section =====

export function buildSpecificationsSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
  const specs = [
    ['Make', data.identification.make],
    ['Model', data.identification.model],
    ['Year', data.identification.modelYear],
    ['Series', data.identification.series],
    ['Trim', data.identification.trim],
    ['Body Class', data.body.bodyClass],
    ['Vehicle Type', data.identification.vehicleType],
    ['Doors', data.dimensions.doors],
    ['Seats', data.body.numberOfSeats]
  ].filter(([, value]) => value);

  if (specs.length === 0) {
    return buildEmptySectionDOCX('Vehicle Specifications', '📋');
  }

  return [...createSectionHeader('Vehicle Specifications', '📋'), createDOCXTable(['Specification', 'Value'], specs)];
}

// ===== Engine Section =====

export function buildEngineSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
  const engine = data.engine;
  const specs = [
    ['Engine Model', engine.model],
    ['Configuration', engine.configuration],
    ['Cylinders', engine.cylinders],
    ['Displacement', engine.displacementL ? `${engine.displacementL}L` : engine.displacementCC ? `${engine.displacementCC}cc` : ''],
    ['Power Output', engine.power ? `${engine.power} kW` : ''],
    ['Fuel Type (Primary)', engine.fuelTypePrimary],
    ['Fuel Type (Secondary)', engine.fuelTypeSecondary],
    ['Turbo', engine.turbo],
    ['Manufacturer', engine.manufacturer]
  ].filter(([, value]) => value);

  if (specs.length === 0) {
    return buildEmptySectionDOCX('Engine & Performance', '⚙️');
  }

  return [...createSectionHeader('Engine & Performance', '⚙️'), createDOCXTable(['Specification', 'Value'], specs)];
}

// ===== Transmission Section =====

export function buildTransmissionSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
  const trans = data.transmission;
  const specs = [
    ['Transmission Style', trans.transmissionStyle],
    ['Number of Speeds', trans.transmissionSpeeds],
    ['Drive Type', trans.driveType]
  ].filter(([, value]) => value);

  if (specs.length === 0) {
    return buildEmptySectionDOCX('Transmission & Drivetrain', '🔄');
  }

  return [...createSectionHeader('Transmission & Drivetrain', '🔄'), createDOCXTable(['Specification', 'Value'], specs)];
}

// ===== Dimensions Section =====

export function buildDimensionsSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
  const dims = data.dimensions;
  const specs = [
    ['Wheelbase', dims.wheelBaseShort || dims.wheelBaseLong ? `${dims.wheelBaseShort || dims.wheelBaseLong}"` : ''],
    ['GVWR', dims.gvwr || dims.gvwrRange],
    ['Curb Weight', dims.curbWeight ? `${dims.curbWeight} lbs` : ''],
    ['Bed Length', dims.bedLength ? `${dims.bedLength}"` : ''],
    ['Cab Type', dims.cabType]
  ].filter(([, value]) => value);

  if (specs.length === 0) {
    return buildEmptySectionDOCX('Dimensions & Capacity', '📐');
  }

  return [...createSectionHeader('Dimensions & Capacity', '📐'), createDOCXTable(['Specification', 'Value'], specs)];
}

// ===== Safety Section =====

export function buildSafetySection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
  const safety = data.safety;
  const features = [
    ['Front Airbags', safety.airBagLocFront],
    ['Side Airbags', safety.airBagLocSide],
    ['Curtain Airbags', safety.airBagLocCurtain],
    ['Knee Airbags', safety.airBagLocKnee],
    ['Seat Belts', safety.seatBeltsAll],
    ['Pretensioner', safety.pretensioner],
    ['ABS', safety.abs],
    ['ESC', safety.esc],
    ['Traction Control', safety.tractionControl],
    ['Brake System', safety.brakeSystemType]
  ].filter(([, value]) => value);

  if (features.length === 0) {
    return buildEmptySectionDOCX('Safety Features', '🛡️');
  }

  return [...createSectionHeader('Safety Features', '🛡️'), createDOCXTable(['Feature', 'Value'], features)];
}

// ===== Manufacturing Section =====

export function buildManufacturingSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
  const mfg = data.manufacturing;
  const specs = [
    ['Manufacturer', data.identification.manufacturer],
    ['Plant City', mfg.plantCity],
    ['Plant State', mfg.plantState],
    ['Plant Country', mfg.plantCountry],
    ['Plant Company', mfg.plantCompanyName],
    ['Destination Market', data.market.destinationMarket]
  ].filter(([, value]) => value);

  if (specs.length === 0) {
    return buildEmptySectionDOCX('Manufacturing Information', '🏭');
  }

  return [...createSectionHeader('Manufacturing Information', '🏭'), createDOCXTable(['Information', 'Value'], specs)];
}

// ===== Safety Recalls Section =====

export function buildRecallsSection(data: ComprehensiveVehicleData): (Paragraph | Table)[] {
  if (data.recalls.length === 0) {
    return [
      ...createSectionHeader('Safety Recalls', '🔧'),
      new Paragraph({
        children: [
          new TextRun({
            text: '✓ ',
            font: DOCX_STYLES.fonts.body,
            size: 24,
            color: DOCX_STYLES.colors.success
          }),
          new TextRun({
            text: 'No open safety recalls found for this vehicle',
            font: DOCX_STYLES.fonts.body,
            size: 22,
            color: DOCX_STYLES.colors.success,
            bold: true
          })
        ],
        spacing: { before: 200, after: 200 },
        shading: {
          fill: DOCX_STYLES.colors.successBg
        }
      })
    ];
  }

  const content: (Paragraph | Table)[] = [];

  data.recalls.forEach((recall, index) => {
    if (index > 0) {
      content.push(new Paragraph({ text: '', spacing: { before: 200 } }));
    }

    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: recall.component,
            font: DOCX_STYLES.fonts.heading,
            size: 24,
            bold: true,
            color: DOCX_STYLES.colors.text
          })
        ],
        spacing: { before: 200, after: 100 },
        shading: {
          fill: DOCX_STYLES.colors.backgroundAlternate
        }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Issue: ',
            font: DOCX_STYLES.fonts.body,
            size: 22,
            bold: true,
            color: DOCX_STYLES.colors.textSecondary
          }),
          new TextRun({
            text: recall.summary,
            font: DOCX_STYLES.fonts.body,
            size: 22
          })
        ],
        spacing: { after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Consequence: ',
            font: DOCX_STYLES.fonts.body,
            size: 22,
            bold: true,
            color: DOCX_STYLES.colors.textSecondary
          }),
          new TextRun({
            text: recall.consequence,
            font: DOCX_STYLES.fonts.body,
            size: 22
          })
        ],
        spacing: { after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Remedy: ',
            font: DOCX_STYLES.fonts.body,
            size: 22,
            bold: true,
            color: DOCX_STYLES.colors.textSecondary
          }),
          new TextRun({
            text: recall.remedy,
            font: DOCX_STYLES.fonts.body,
            size: 22
          })
        ],
        spacing: { after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Campaign #${recall.nhtsaCampaignNumber} | Reported: ${recall.reportReceivedDate}`,
            font: DOCX_STYLES.fonts.body,
            size: 20,
            color: DOCX_STYLES.colors.textLight,
            italics: true
          })
        ],
        spacing: { after: 100 }
      })
    );
  });

  return [...createSectionHeader(`Safety Recalls (${data.recalls.length} Found)`, '🔧'), ...content];
}

// ===== Ownership History Section =====

export function buildOwnershipHistorySection(ownership: OwnershipHistory): (Paragraph | Table)[] {
  if (!ownership.owners || ownership.owners.length === 0) {
    return buildEmptySectionDOCX('Ownership History', '👤');
  }

  const rows = ownership.owners.map(owner => [
    owner.ownerNumber.toString(),
    owner.startDate || 'N/A',
    owner.endDate || 'Current',
    owner.state || 'N/A',
    owner.durationMonths?.toString() || 'N/A'
  ]);

  const content: (Paragraph | Table)[] = [];

  if (ownership.numberOfOwners) {
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Total Owners: ',
            font: DOCX_STYLES.fonts.body,
            size: 22,
            bold: true
          }),
          ...createStatusBadge(ownership.numberOfOwners.toString(), 'info')
        ],
        spacing: { before: 200, after: 200 }
      })
    );
  }

  content.push(createDOCXTable(
    ['Owner #', 'Start Date', 'End Date', 'State', 'Duration (months)'],
    rows
  ));

  return [...createSectionHeader('Ownership History', '👤'), ...content];
}

// ===== Sale History Section =====

export function buildSaleHistorySection(sales: SaleHistory): (Paragraph | Table)[] {
  if (!sales.sales || sales.sales.length === 0) {
    return buildEmptySectionDOCX('Sale History', '💰');
  }

  const rows = sales.sales.map(sale => [
    sale.date,
    sale.price && sale.currency ? `${sale.currency} ${sale.price.toLocaleString()}` : 'N/A',
    sale.location || 'N/A',
    sale.saleType
  ]);

  return [...createSectionHeader('Sale History', '💰'), createDOCXTable(['Date', 'Price', 'Location', 'Type'], rows)];
}

// ===== Odometer History Section =====

export function buildOdometerHistorySection(odometer: OdometerHistory): (Paragraph | Table)[] {
  if (!odometer.readings || odometer.readings.length === 0) {
    return buildEmptySectionDOCX('Odometer History', '📊');
  }

  const content: (Paragraph | Table)[] = [];

  if (odometer.rollbackDetected) {
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '⚠ WARNING: Rollback Detected',
            font: DOCX_STYLES.fonts.body,
            size: 24,
            bold: true,
            color: DOCX_STYLES.colors.error
          })
        ],
        spacing: { before: 200, after: 100 },
        shading: {
          fill: DOCX_STYLES.colors.errorBg
        }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'This vehicle has a detected odometer rollback. Exercise caution.',
            font: DOCX_STYLES.fonts.body,
            size: 22,
            color: DOCX_STYLES.colors.error
          })
        ],
        spacing: { after: 200 }
      })
    );
  }

  const rows = odometer.readings.map(reading => [
    reading.date,
    reading.mileage.toLocaleString(),
    reading.source,
    reading.verified ? 'Yes' : 'No'
  ]);

  content.push(createDOCXTable(['Date', 'Mileage', 'Source', 'Verified'], rows));

  return [...createSectionHeader('Odometer History', '📊'), ...content];
}

// ===== Title History Section =====

export function buildTitleHistorySection(titleHistory: TitleHistory): (Paragraph | Table)[] {
  if (!titleHistory.records || titleHistory.records.length === 0) {
    return buildEmptySectionDOCX('Title History', '📄');
  }

  const rows = titleHistory.records.map(record => [
    record.date,
    record.state,
    record.titleNumber || 'N/A',
    record.transferType
  ]);

  return [...createSectionHeader('Title History', '📄'), createDOCXTable(['Date', 'State', 'Title Number', 'Transfer Type'], rows)];
}

// ===== Inspection History Section =====

export function buildInspectionHistorySection(inspections: InspectionHistory): (Paragraph | Table)[] {
  const hasEmissions = inspections.emissions && inspections.emissions.length > 0;
  const hasSafety = inspections.safety && inspections.safety.length > 0;

  if (!hasEmissions && !hasSafety) {
    return buildEmptySectionDOCX('Inspection History', '🔍');
  }

  const content: (Paragraph | Table)[] = [];

  if (hasEmissions) {
    content.push(
      new Paragraph({
        text: 'Emissions Inspections',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 }
      })
    );

    const emissionsRows = inspections.emissions!.map(inspection => [
      inspection.date,
      inspection.location,
      inspection.result.toUpperCase(),
      inspection.notes || 'N/A'
    ]);

    content.push(createDOCXTable(['Date', 'Location', 'Result', 'Notes'], emissionsRows));
  }

  if (hasSafety) {
    content.push(
      new Paragraph({
        text: 'Safety Inspections',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 }
      })
    );

    const safetyRows = inspections.safety!.map(inspection => [
      inspection.date,
      inspection.location,
      inspection.result.toUpperCase(),
      inspection.notes || 'N/A'
    ]);

    content.push(createDOCXTable(['Date', 'Location', 'Result', 'Notes'], safetyRows));
  }

  return [...createSectionHeader('Inspection History', '🔍'), ...content];
}

// ===== Insurance History Section =====

export function buildInsuranceHistorySection(insurance: InsuranceHistory): (Paragraph | Table)[] {
  if (!insurance.records || insurance.records.length === 0) {
    return buildEmptySectionDOCX('Insurance History', '🛡️');
  }

  const rows = insurance.records.map(record => [
    record.claimDate,
    record.claimType,
    record.amount ? record.amount.toLocaleString() : 'N/A',
    record.status.toUpperCase()
  ]);

  return [...createSectionHeader('Insurance History', '🛡️'), createDOCXTable(['Claim Date', 'Type', 'Amount', 'Status'], rows)];
}

// ===== Junk & Salvage Section =====

export function buildJunkSalvageSection(junkSalvage: JunkSalvageInfo): (Paragraph | Table)[] {
  if (!junkSalvage.records || junkSalvage.records.length === 0) {
    return buildEmptySectionDOCX('Junk & Salvage Information', '⚠️');
  }

  const content: (Paragraph | Table)[] = [];
  const hasWarning = junkSalvage.isSalvage || junkSalvage.isJunk;

  if (hasWarning) {
    const warningText = [];
    if (junkSalvage.isSalvage) warningText.push('This vehicle has a salvage title.');
    if (junkSalvage.isJunk) warningText.push('This vehicle has been designated as junk.');

    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '⚠ WARNING',
            font: DOCX_STYLES.fonts.body,
            size: 24,
            bold: true,
            color: DOCX_STYLES.colors.warning
          })
        ],
        spacing: { before: 200, after: 100 },
        shading: {
          fill: DOCX_STYLES.colors.warningBg
        }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: warningText.join(' '),
            font: DOCX_STYLES.fonts.body,
            size: 22,
            color: DOCX_STYLES.colors.warning
          })
        ],
        spacing: { after: 200 }
      })
    );
  }

  const rows = junkSalvage.records.map(record => [
    record.date,
    record.type,
    record.reason || 'N/A',
    record.auctionHouse || 'N/A'
  ]);

  content.push(createDOCXTable(['Date', 'Type', 'Reason', 'Auction House'], rows));

  return [...createSectionHeader('Junk & Salvage Information', '⚠️'), ...content];
}

// ===== Accident History Section =====

export function buildAccidentHistorySection(accidents: AccidentHistory): (Paragraph | Table)[] {
  if (!accidents.accidents || accidents.accidents.length === 0) {
    return buildEmptySectionDOCX('Accident History', '💥');
  }

  const content: (Paragraph | Table)[] = [];

  content.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Total Accidents: ',
          font: DOCX_STYLES.fonts.body,
          size: 22,
          bold: true
        }),
        ...createStatusBadge(
          accidents.totalAccidents.toString(),
          accidents.totalAccidents > 1 ? 'error' : 'warning'
        )
      ],
      spacing: { before: 200, after: 200 }
    })
  );

  accidents.accidents.forEach((accident, index) => {
    if (index > 0) {
      content.push(new Paragraph({ text: '', spacing: { before: 300 } }));
    }

    content.push(
      new Paragraph({
        text: `Accident #${index + 1} - ${accident.date}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 }
      })
    );

    const accidentDetails = [
      ['Severity', accident.severity.toUpperCase()],
      ['Airbag Deployment', accident.airbagDeployment ? 'Yes' : 'No'],
      ['Estimated Cost', accident.estimatedCost ? accident.estimatedCost.toLocaleString() : 'N/A'],
      ['Location', accident.location || 'N/A']
    ];

    content.push(createDOCXTable(['Detail', 'Value'], accidentDetails));

    if (accident.damageAreas && accident.damageAreas.length > 0) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Damage Areas:',
              font: DOCX_STYLES.fonts.body,
              size: 22,
              bold: true
            })
          ],
          spacing: { before: 200, after: 100 }
        })
      );

      accident.damageAreas.forEach(damage => {
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${damage.area}: ${damage.severity}`,
                font: DOCX_STYLES.fonts.body,
                size: 22
              })
            ],
            spacing: { after: 60 }
          })
        );
      });
    }
  });

  return [...createSectionHeader('Accident History', '💥'), ...content];
}

// ===== Lien & Impound Section =====

export function buildLienImpoundSection(lienImpound: LienImpoundHistory): (Paragraph | Table)[] {
  const hasLiens = lienImpound.liens && lienImpound.liens.length > 0;
  const hasImpounds = lienImpound.impounds && lienImpound.impounds.length > 0;

  if (!hasLiens && !hasImpounds) {
    return buildEmptySectionDOCX('Lien & Impound Records', '🔒');
  }

  const content: (Paragraph | Table)[] = [];

  if (hasLiens) {
    content.push(
      new Paragraph({
        text: 'Liens',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 }
      })
    );

    const lienRows = lienImpound.liens!.map(lien => [
      lien.date,
      lien.holder,
      lien.amount ? lien.amount.toLocaleString() : 'N/A',
      lien.status.toUpperCase()
    ]);

    content.push(createDOCXTable(['Date', 'Holder', 'Amount', 'Status'], lienRows));
  }

  if (hasImpounds) {
    content.push(
      new Paragraph({
        text: 'Impounds',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 }
      })
    );

    const impoundRows = lienImpound.impounds!.map(impound => [
      impound.date,
      impound.location,
      impound.reason,
      impound.releaseDate || 'Not Released'
    ]);

    content.push(createDOCXTable(['Date', 'Location', 'Reason', 'Release Date'], impoundRows));
  }

  return [...createSectionHeader('Lien & Impound Records', '🔒'), ...content];
}

// ===== Theft History Section =====

export function buildTheftHistorySection(theft: TheftHistory): (Paragraph | Table)[] {
  if (!theft.records || theft.records.length === 0) {
    return buildEmptySectionDOCX('Theft History', '🚓');
  }

  const content: (Paragraph | Table)[] = [];

  if (theft.isStolen) {
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '⚠ WARNING: STOLEN VEHICLE',
            font: DOCX_STYLES.fonts.body,
            size: 24,
            bold: true,
            color: DOCX_STYLES.colors.error
          })
        ],
        spacing: { before: 200, after: 100 },
        shading: {
          fill: DOCX_STYLES.colors.errorBg
        }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'This vehicle is currently reported as stolen. Do not purchase.',
            font: DOCX_STYLES.fonts.body,
            size: 22,
            color: DOCX_STYLES.colors.error,
            bold: true
          })
        ],
        spacing: { after: 200 }
      })
    );
  }

  const rows = theft.records.map(record => [
    record.reportDate,
    record.recoveryDate || 'Not Recovered',
    record.location,
    record.status.toUpperCase()
  ]);

  content.push(createDOCXTable(['Report Date', 'Recovery Date', 'Location', 'Status'], rows));

  return [...createSectionHeader('Theft History', '🚓'), ...content];
}

// ===== Title Brands Section =====

export function buildTitleBrandsSection(titleBrands: TitleBrands): (Paragraph | Table)[] {
  if (!titleBrands.brands || titleBrands.brands.length === 0) {
    return buildEmptySectionDOCX('Title Brands', '🏷️');
  }

  const content: (Paragraph | Table)[] = [];
  const warningBrands = ['salvage', 'flood', 'lemon'];
  const hasWarning = titleBrands.brands.some(b => warningBrands.includes(b.brand));

  if (hasWarning) {
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '⚠ WARNING',
            font: DOCX_STYLES.fonts.body,
            size: 24,
            bold: true,
            color: DOCX_STYLES.colors.warning
          })
        ],
        spacing: { before: 200, after: 100 },
        shading: {
          fill: DOCX_STYLES.colors.warningBg
        }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'This vehicle has title brands that may affect its value and safety.',
            font: DOCX_STYLES.fonts.body,
            size: 22,
            color: DOCX_STYLES.colors.warning
          })
        ],
        spacing: { after: 200 }
      })
    );
  }

  const rows = titleBrands.brands.map(brand => [
    brand.brand.toUpperCase(),
    brand.date,
    brand.state,
    brand.description || 'N/A'
  ]);

  content.push(createDOCXTable(['Brand Type', 'Date', 'State', 'Description'], rows));

  return [...createSectionHeader('Title Brands', '🏷️'), ...content];
}

// ===== Market Value Section =====

export function buildMarketValueSection(marketValue: MarketValue): (Paragraph | Table)[] {
  if (!marketValue) {
    return buildEmptySectionDOCX('Market Value', '💵');
  }

  const specs = [
    ['Current Value', marketValue.currentValue ? `${marketValue.currency} ${marketValue.currentValue.toLocaleString()}` : 'N/A'],
    ['Source', marketValue.source],
    ['Valuation Date', marketValue.date],
    ['Condition', marketValue.condition ? marketValue.condition.toUpperCase() : 'N/A'],
    ['Mileage Adjustment', marketValue.mileageAdjustment ? `${marketValue.currency} ${marketValue.mileageAdjustment.toLocaleString()}` : 'N/A']
  ];

  return [...createSectionHeader('Market Value', '💵'), createDOCXTable(['Detail', 'Value'], specs)];
}

// ===== Warranty Section =====

export function buildWarrantySection(warranty: WarrantyInfo): (Paragraph | Table)[] {
  const hasManufacturer = warranty.manufacturer !== undefined;
  const hasExtended = warranty.extended && warranty.extended.length > 0;

  if (!hasManufacturer && !hasExtended) {
    return buildEmptySectionDOCX('Warranty Information', '🔒');
  }

  const content: (Paragraph | Table)[] = [];

  if (hasManufacturer) {
    content.push(
      new Paragraph({
        text: 'Manufacturer Warranty',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 }
      })
    );

    const mfgWarranty = warranty.manufacturer!;
    const mfgRows = [
      ['Type', mfgWarranty.type],
      ['Start Date', mfgWarranty.startDate],
      ['End Date', mfgWarranty.endDate],
      ['Mileage Limit', mfgWarranty.mileageLimit ? `${mfgWarranty.mileageLimit.toLocaleString()} miles` : 'N/A'],
      ['Provider', mfgWarranty.provider],
      ['Status', mfgWarranty.status.toUpperCase()]
    ];

    content.push(createDOCXTable(['Detail', 'Value'], mfgRows));
  }

  if (hasExtended) {
    content.push(
      new Paragraph({
        text: 'Extended Warranties',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 }
      })
    );

    warranty.extended!.forEach((ext, index) => {
      if (index > 0) {
        content.push(new Paragraph({ text: '', spacing: { before: 200 } }));
      }

      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Extended Warranty #${index + 1}`,
              font: DOCX_STYLES.fonts.body,
              size: 22,
              bold: true
            })
          ],
          spacing: { before: 120, after: 100 }
        })
      );

      const extRows = [
        ['Type', ext.type],
        ['Start Date', ext.startDate],
        ['End Date', ext.endDate],
        ['Mileage Limit', ext.mileageLimit ? `${ext.mileageLimit.toLocaleString()} miles` : 'N/A'],
        ['Provider', ext.provider],
        ['Status', ext.status.toUpperCase()]
      ];

      content.push(createDOCXTable(['Detail', 'Value'], extRows));
    });
  }

  return [...createSectionHeader('Warranty Information', '🔒'), ...content];
}

// ===== NCS Valuation Section =====

export function buildNCSValuationSection(options: ReportGenerationOptions): (Paragraph | Table)[] {
  if (!options.includeNCSValuation || !options.cifUsd) {
    return [];
  }

  const rows = [
    ['CIF Value (USD)', `$${options.cifUsd.toLocaleString()}`],
    ['CIF Value (NGN)', options.cifNgn ? `₦${options.cifNgn.toLocaleString()}` : 'N/A'],
    ['CBN Exchange Rate', options.cbnRate ? `₦${options.cbnRate.toLocaleString()}/USD` : 'N/A'],
    ['Confidence Level', options.confidence?.toUpperCase() || 'N/A']
  ];

  return [...createSectionHeader('NCS Valuation', '💰'), createDOCXTable(['Detail', 'Value'], rows)];
}

// ===== Duty Breakdown Section =====

export function buildDutyBreakdownSection(options: ReportGenerationOptions): (Paragraph | Table)[] {
  if (!options.includeDutyBreakdown || !options.dutyBreakdown) {
    return [];
  }

  const duty = options.dutyBreakdown;

  const rows = [
    ['Import Duty (35%)', `₦${duty.importDuty.toLocaleString()}`],
    ['Surcharge (7%)', `₦${duty.surcharge.toLocaleString()}`],
    ['NAC Levy (20%)', `₦${duty.nacLevy.toLocaleString()}`],
    ['CISS (1%)', `₦${duty.ciss.toLocaleString()}`],
    ['ETLS (0.5%)', `₦${duty.etls.toLocaleString()}`],
    ['VAT (7.5%)', `₦${duty.vat.toLocaleString()}`]
  ];

  const content: (Paragraph | Table)[] = [createDOCXTable(['Duty Component', 'Amount'], rows)];

  // Add total row with special styling
  content.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'TOTAL IMPORT DUTY: ',
          font: DOCX_STYLES.fonts.heading,
          size: 26,
          bold: true,
          color: DOCX_STYLES.colors.white
        }),
        new TextRun({
          text: `₦${duty.totalDutyNgn.toLocaleString()}`,
          font: DOCX_STYLES.fonts.monospace,
          size: 26,
          bold: true,
          color: DOCX_STYLES.colors.white
        })
      ],
      spacing: { before: 200, after: 200 },
      shading: {
        fill: DOCX_STYLES.colors.primary
      },
      alignment: AlignmentType.CENTER
    })
  );

  return [...createSectionHeader('Nigerian Import Duty Breakdown', '📊'), ...content];
}
