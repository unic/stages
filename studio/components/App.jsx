import styled from "@emotion/styled";

const AppContainer = styled.div`
    
`;

const App = ({ children }) => {
    return (
        <AppContainer>
            <h1 className="visually-hidden">Stages Studio</h1>
            {children}
        </AppContainer>
    );
};

export default App;