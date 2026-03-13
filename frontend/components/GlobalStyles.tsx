
import React from 'react';
import { AppTheme } from '../types';

export const GlobalStyles: React.FC<{ theme: AppTheme }> = ({ theme }) => {
    const { primaryColor, buttonStyle } = theme;

    const css = `
        .dynamic-btn {
            background-color: ${buttonStyle === 'solid' ? primaryColor : 'transparent'} !important;
            color: ${buttonStyle === 'solid' ? '#ffffff' : primaryColor} !important;
            border: 2px solid ${primaryColor} !important;
            transition: all 0.2s ease-in-out;
        }
        
        .dynamic-btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            ${buttonStyle === 'outline' ? `background-color: ${primaryColor} !important; color: #ffffff !important;` : ''}
        }

        .dynamic-btn:disabled {
            background-color: #e5e7eb !important;
            color: #9ca3af !important;
            border-color: #e5e7eb !important;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .text-dynamic-primary {
            color: ${primaryColor} !important;
        }

        .bg-dynamic-primary-light {
            background-color: ${primaryColor}1A !important; /* 10% opacity roughly */
        }
    `;

    return <style>{css}</style>;
};
