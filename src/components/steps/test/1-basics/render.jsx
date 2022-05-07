const FormRenderer = ({ fields, onCollectionAction, data, errors }) => {
    return (
        <div>
            {fields.country}
            <br />
            {fields.postalcode}
            <br />
            {fields.city}
            <br />
            {fields.username}
            <br />
        </div>
    );
};

export default FormRenderer;