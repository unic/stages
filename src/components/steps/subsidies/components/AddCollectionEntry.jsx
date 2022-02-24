import Button from "react-bootstrap/Button";

const AddCollectionEntry = ({ onClick }) => (
    <Button
        type="button"
        size="sm"
        variant="success"
        onClick={onClick}
        style={{
            width: "18px",
            height: "18px",
            lineHeight: 0,
            fontSize: "16px",
            fontWeight: 700,
            padding: 0
        }}
    >+</Button>
);

export default AddCollectionEntry;