import { createContext, useContext } from 'react';

export const TooltipContext = createContext(true);
export const useTooltips = () => useContext(TooltipContext);
