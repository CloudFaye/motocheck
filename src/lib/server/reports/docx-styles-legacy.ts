/**
 * DOCX Styling Configuration
 * 
 * This module defines styling constants and configuration for DOCX report generation.
 * It provides consistent fonts, colors, spacing, and page layout settings to ensure
 * professional, well-formatted Word documents.
 */

import {
	AlignmentType,
	HeadingLevel,
	type IParagraphOptions,
	type ITableOptions,
	type ITableCellOptions,
	convertInchesToTwip
} from 'docx';

/**
 * DOCX Style Configuration Interface
 * Defines the complete styling system for DOCX reports
 */
export interface DOCXStyleConfig {
	fonts: {
		heading: string;
		body: string;
		monospace: string;
	};
	colors: {
		primary: string;
		secondary: string;
		success: string;
		warning: string;
		error: string;
		text: string;
		textLight: string;
		border: string;
		borderLight: string;
		backgroundLight: string;
		backgroundAlternate: string;
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
 * Main style configuration object - Carfax-inspired professional palette
 */
export const DOCX_STYLES: DOCXStyleConfig = {
	fonts: {
		heading: 'Segoe UI',
		body: 'Calibri',
		monospace: 'Courier New'
	},
	colors: {
		primary: '1E3A5F', // Deep Blue (Carfax-inspired)
		secondary: '475569', // Secondary text
		success: '10B981', // Green
		warning: 'F59E0B', // Amber
		error: 'EF4444', // Red
		text: '0F172A', // Primary text
		textLight: '64748B', // Muted text
		border: 'E2E8F0', // Border
		borderLight: 'E5E7EB', // Light border
		backgroundLight: 'FFFFFF', // White
		backgroundAlternate: 'F9FAFB' // Very light gray
	},
	spacing: {
		sectionBefore: 400, // 20pt
		sectionAfter: 200, // 10pt
		paragraphBefore: 120, // 6pt
		paragraphAfter: 120, // 6pt
		tableBefore: 200, // 10pt
		tableAfter: 200 // 10pt
	}
};

/**
 * Page Layout Settings
 * A4 page size with 1-inch margins
 */
export const PAGE_LAYOUT = {
	page: {
		size: {
			width: convertInchesToTwip(8.27), // A4 width: 210mm = 8.27 inches
			height: convertInchesToTwip(11.69) // A4 height: 297mm = 11.69 inches
		},
		margin: {
			top: convertInchesToTwip(1), // 1 inch
			right: convertInchesToTwip(1), // 1 inch
			bottom: convertInchesToTwip(1), // 1 inch
			left: convertInchesToTwip(1) // 1 inch
		}
	}
};

/**
 * Heading 1 Style (Section Titles) - Carfax-inspired with deep blue
 */
export const HEADING_1_STYLE: Partial<IParagraphOptions> = {
	heading: HeadingLevel.HEADING_1,
	spacing: {
		before: DOCX_STYLES.spacing.sectionBefore,
		after: DOCX_STYLES.spacing.sectionAfter
	},
	run: {
		font: DOCX_STYLES.fonts.heading,
		size: 28, // 14pt
		bold: true,
		color: DOCX_STYLES.colors.primary // Deep blue for section headers
	}
};

/**
 * Heading 2 Style (Subsection Titles)
 */
export const HEADING_2_STYLE: Partial<IParagraphOptions> = {
	heading: HeadingLevel.HEADING_2,
	spacing: {
		before: 240, // 12pt
		after: 120 // 6pt
	},
	run: {
		font: DOCX_STYLES.fonts.heading,
		size: 24, // 12pt
		bold: true,
		color: DOCX_STYLES.colors.text
	}
};

/**
 * Body Text Style
 */
export const BODY_TEXT_STYLE: Partial<IParagraphOptions> = {
	spacing: {
		before: DOCX_STYLES.spacing.paragraphBefore,
		after: DOCX_STYLES.spacing.paragraphAfter,
		line: 276 // 1.15 line spacing
	},
	run: {
		font: DOCX_STYLES.fonts.body,
		size: 22, // 11pt
		color: DOCX_STYLES.colors.text
	}
};

/**
 * Caption Style (for image captions, table notes)
 */
export const CAPTION_STYLE: Partial<IParagraphOptions> = {
	spacing: {
		before: 60, // 3pt
		after: 120 // 6pt
	},
	alignment: AlignmentType.CENTER,
	run: {
		font: DOCX_STYLES.fonts.body,
		size: 18, // 9pt
		color: DOCX_STYLES.colors.textLight,
		italics: true
	}
};

/**
 * Empty State Title Style
 */
export const EMPTY_STATE_TITLE_STYLE: Partial<IParagraphOptions> = {
	spacing: {
		before: 200,
		after: 100
	},
	alignment: AlignmentType.CENTER,
	run: {
		font: DOCX_STYLES.fonts.body,
		size: 24, // 12pt
		color: DOCX_STYLES.colors.secondary
	}
};

/**
 * Empty State Message Style
 */
export const EMPTY_STATE_MESSAGE_STYLE: Partial<IParagraphOptions> = {
	spacing: {
		after: 200
	},
	alignment: AlignmentType.CENTER,
	run: {
		font: DOCX_STYLES.fonts.body,
		size: 20, // 10pt
		color: DOCX_STYLES.colors.textLight,
		italics: true
	}
};

/**
 * Warning Text Style
 */
export const WARNING_TEXT_STYLE: Partial<IParagraphOptions> = {
	spacing: {
		before: 120,
		after: 120
	},
	run: {
		font: DOCX_STYLES.fonts.body,
		size: 22, // 11pt
		color: DOCX_STYLES.colors.warning,
		bold: true
	}
};

/**
 * Error Text Style
 */
export const ERROR_TEXT_STYLE: Partial<IParagraphOptions> = {
	spacing: {
		before: 120,
		after: 120
	},
	run: {
		font: DOCX_STYLES.fonts.body,
		size: 22, // 11pt
		color: DOCX_STYLES.colors.error,
		bold: true
	}
};

/**
 * Table Header Cell Style - Deep Blue Background with White Text
 */
export const TABLE_HEADER_CELL_STYLE: Partial<ITableCellOptions> = {
	shading: {
		fill: DOCX_STYLES.colors.primary // Deep blue header
	}
};

/**
 * Table Cell Style (Even Rows)
 */
export const TABLE_CELL_EVEN_STYLE: Partial<ITableCellOptions> = {
	shading: {
		fill: DOCX_STYLES.colors.backgroundAlternate
	}
};

/**
 * Table Cell Style (Odd Rows)
 */
export const TABLE_CELL_ODD_STYLE: Partial<ITableCellOptions> = {
	shading: {
		fill: DOCX_STYLES.colors.backgroundLight
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
} satisfies Partial<ITableOptions>;

/**
 * Image Maximum Width (in pixels)
 * 6 inches = 576 pixels at 96 DPI
 */
export const IMAGE_MAX_WIDTH = 576;

/**
 * Image Maximum Height (in pixels)
 * Maintains 4:3 aspect ratio
 */
export const IMAGE_MAX_HEIGHT = 432;

/**
 * Maximum number of images to embed in report
 */
export const MAX_IMAGES = 4;

/**
 * Image fetch timeout (milliseconds)
 */
export const IMAGE_FETCH_TIMEOUT = 5000;

/**
 * Maximum image file size (bytes)
 * 5MB limit
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Highlight Card Style (for key highlights section)
 */
export const HIGHLIGHT_CARD_STYLE: Partial<IParagraphOptions> = {
	spacing: {
		before: 120,
		after: 120
	},
	alignment: AlignmentType.CENTER,
	run: {
		font: DOCX_STYLES.fonts.body,
		size: 22,
		color: DOCX_STYLES.colors.text
	}
};

/**
 * Highlight Number Style (large numbers in cards)
 */
export const HIGHLIGHT_NUMBER_STYLE: Partial<IParagraphOptions> = {
	spacing: {
		before: 60,
		after: 60
	},
	alignment: AlignmentType.CENTER,
	run: {
		font: DOCX_STYLES.fonts.heading,
		size: 48, // 24pt
		bold: true,
		color: DOCX_STYLES.colors.primary
	}
};

/**
 * Badge Style - Success (Green)
 */
export const BADGE_SUCCESS_STYLE: Partial<IParagraphOptions> = {
	spacing: {
		before: 60,
		after: 60
	},
	alignment: AlignmentType.CENTER,
	run: {
		font: DOCX_STYLES.fonts.body,
		size: 20,
		bold: true,
		color: DOCX_STYLES.colors.success
	}
};

/**
 * Badge Style - Warning (Amber)
 */
export const BADGE_WARNING_STYLE: Partial<IParagraphOptions> = {
	spacing: {
		before: 60,
		after: 60
	},
	alignment: AlignmentType.CENTER,
	run: {
		font: DOCX_STYLES.fonts.body,
		size: 20,
		bold: true,
		color: DOCX_STYLES.colors.warning
	}
};

/**
 * Badge Style - Error (Red)
 */
export const BADGE_ERROR_STYLE: Partial<IParagraphOptions> = {
	spacing: {
		before: 60,
		after: 60
	},
	alignment: AlignmentType.CENTER,
	run: {
		font: DOCX_STYLES.fonts.body,
		size: 20,
		bold: true,
		color: DOCX_STYLES.colors.error
	}
};

/**
 * Gold Accent Color (for highlights and special elements)
 */
export const ACCENT_GOLD = 'D4943A';
