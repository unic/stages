const InnerAbsoluteRight = ({children}) => (
    <div style={{
        position: "absolute",
        content: "",
        top: "6px",
        right: "-28px",
        width: "24px"
    }}>
        {children}
    </div>
);

export default InnerAbsoluteRight;