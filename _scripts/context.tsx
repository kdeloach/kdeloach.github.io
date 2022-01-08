import React, { useState } from "react";

interface IContext {
    state: any;
    setState: (state: any) => void;
}

export const AppContext = React.createContext<IContext | null>(null);

export const RootComponent: React.FC = ({ children }) => {
    const [state, setState] = useState<IContext>();
    return (
        <AppContext.Provider value={{ state, setState }}>
            {children}
        </AppContext.Provider>
    );
};
