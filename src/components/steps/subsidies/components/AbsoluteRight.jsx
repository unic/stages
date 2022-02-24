const AbsoluteRight = ({children}) => (
    <div style={{
        position: "absolute",
        content: "",
        top: "16px",
        right: "-40px",
        width: "24px"
    }}>
        {children}
    </div>
);

export default AbsoluteRight;