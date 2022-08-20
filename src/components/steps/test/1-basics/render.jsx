const FormRenderer = ({ fields, onCollectionAction, data, errors }) => {
    return (
        <div>
            {fields.country}
            <br />
            {fields.postalcode}
            <br />
            {fields.city}
            <br />
            {fields.city2}
            <br />
            {fields.post} {fields.comment1} {fields.comment2}
        </div>
    );
};

export default FormRenderer;