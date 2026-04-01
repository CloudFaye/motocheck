/**
 * Improved DOCX Styling Configuration
 * Carfax-inspired professional design for Word documents
 */

import {
  AlignmentType,
  HeadingLevel,
  type IParagraphOptions,
  type ITableCellOptions,
  convertInchesToTwip,
  BorderStyle,
  VerticalAlign
} from 'docx';

/**
 * Improved DOCX Style Configuration
 * Professional color palette inspired by Carfax reports
 */
export interface DOCXStyleConfig {
  fonts: {
    heading: string;
    body: string;
    monospace: string;
  };
  colors: {
    primary: string;
    primaryDark: string;
    accent: string;
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    info: string;
    infoBg: string;
    text: string;
    textSecondary: string;
    textLight: string;
    border: string;
    borderLight: string;
    backgroundLight: string;
    backgroundAlternate: string;
    white: string;
  };
  spacing: {
    sectionBefore: number;
    sectionAfter: number;
    paragraphBefore: number;
    paragraphAfter: number;
    tableBefore: number;
    tableAfter: number;
  };
}

/**
 * Main style configuration - Professional color palette
 */
export const DOCX_STYLES: DOCXStyleConfig = {
  fonts: {
    heading: 'Calibri',
    body: 'Calibri',
    monospace: 'Courier New'
  },
  colors: {
    primary: '1E3A5F',      // Deep blue
    primaryDark: '152A45',  // Darker blue
    accent: 'D4943A',       // Gold accent
    success: '10B981',      // Green
    successBg: 'D1FAE5',    // Light green
    warning: 'F59E0B',      // Amber
    warningBg: 'FEF3C7',    // Light amber
    error: 'EF4444',        // Red
    errorBg: 'FEE2E2',      // Light red
    info: '3B82F6',         // Blue
    infoBg: 'DBEAFE',       // Light blue
    text: '1A1A1A',         // Near black
    textSecondary: '4B5563', // Gray
    textLight: '6B7280',    // Light gray
    border: 'E5E7EB',       // Border gray
    borderLight: 'F3F4F6',  // Light border
    backgroundLight: 'F8FAFC', // Light background
    backgroundAlternate: 'F1F5F9', // Alternate background
    white: 'FFFFFF'         // White
  },
  spacing: {
    sectionBefore: 400,
    sectionAfter: 200,
    paragraphBefore: 120,
    paragraphAfter: 120,
    tableBefore: 200,
    tableAfter: 200
  }
};

/**
 * Page Layout Settings - A4 with standard margins
 */
export const PAGE_LAYOUT = {
  page: {
    size: {
      width: convertInchesToTwip(8.27),
      height: convertInchesToTwip(11.69)
    },
    margin: {
      top: convertInchesToTwip(0.75),
      right: convertInchesToTwip(0.75),
      bottom: convertInchesToTwip(0.75),
      left: convertInchesToTwip(0.75)
    }
  }
};

/**
 * Heading 1 Style - Section Titles
 */
export const HEADING_1_STYLE: Partial<IParagraphOptions> = {
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
};

/**
 * Heading 2 Style - Subsection Titles
 */
export const HEADING_2_STYLE: Partial<IParagraphOptions> = {
  heading: HeadingLevel.HEADING_2,
  spacing: {
    before: 240,
    after: 120
  },
  run: {
    font: DOCX_STYLES.fonts.heading,
    size: 24,
    bold: true,
    color: DOCX_STYLES.colors.textSecondary
  }
};

/**
 * Body Text Style
 */
export const BODY_TEXT_STYLE: Partial<IParagraphOptions> = {
  spacing: {
    before: DOCX_STYLES.spacing.paragraphBefore,
    after: DOCX_STYLES.spacing.paragraphAfter,
    line: 276
  },
  run: {
    font: DOCX_STYLES.fonts.body,
    size: 22,
    color: DOCX_STYLES.colors.text
  }
};

/**
 * Caption Style
 */
export const CAPTION_STYLE: Partial<IParagraphOptions> = {
  spacing: {
    before: 60,
    after: 120
  },
  alignment: AlignmentType.CENTER,
  run: {
    font: DOCX_STYLES.fonts.body,
    size: 18,
    color: DOCX_STYLES.colors.textLight,
    italics: true
  }
};

/**
 * Table Header Cell Style
 */
export const TABLE_HEADER_CELL_STYLE: Partial<ITableCellOptions> = {
  shading: {
    fill: DOCX_STYLES.colors.primary
  },
  verticalAlign: VerticalAlign.CENTER
};

/**
 * Table Cell Style - Even Rows
 */
export const TABLE_CELL_EVEN_STYLE: Partial<ITableCellOptions> = {
  shading: {
    fill: DOCX_STYLES.colors.backgroundAlternate
  }
};

/**
 * Table Cell Style - Odd Rows
 */
export const TABLE_CELL_ODD_STYLE: Partial<ITableCellOptions> = {
  shading: {
    fill: DOCX_STYLES.colors.white
  }
};

/**
 * Standard Table Configuration
 */
export const TABLE_STYLE = {
  width: {
    size: 100,
    type: 'pct' as const
  },
  margins: {
    top: 100,
    bottom: 100,
    left: 100,
    right: 100
  }
};

/**
 * Border styles for tables
 */
export const TABLE_BORDERS = {
  top: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: DOCX_STYLES.colors.border
  },
  bottom: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: DOCX_STYLES.colors.border
  },
  left: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: DOCX_STYLES.colors.border
  },
  right: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: DOCX_STYLES.colors.border
  },
  insideHorizontal: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: DOCX_STYLES.colors.borderLight
  },
  insideVertical: {
    style: BorderStyle.SINGLE,
    size: 1,
    color: DOCX_STYLES.colors.borderLight
  }
};

/**
 * Image settings
 */
export const IMAGE_MAX_WIDTH = 576;
export const IMAGE_MAX_HEIGHT = 432;
export const MAX_IMAGES = 4;
export const IMAGE_FETCH_TIMEOUT = 5000;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
