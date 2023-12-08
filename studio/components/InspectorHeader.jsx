import useStagesStore from './store';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Search } from 'lucide-react';
import { Filter } from 'lucide-react';

const GeneralConfig = () => {
    const store = useStagesStore();

    return (
        <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: "18px", fontWeight: 400 }}>Stages Studio</div>
                <div style={{ fontSize: "12px", color: "#999999", lineHeight: "25px" }}>{store.generalConfig.status}</div>
                <div style={{ marginTop: "-6px", fontSize: "14px" }}>
                    {store.generalConfig.status === "draft" && <Button link label="publish" onClick={() => store.publish()} />}
                    {store.generalConfig.status === "published" && <Button link label="archive" onClick={() => store.archive()} />}
                    {store.generalConfig.status === "archived" && <Button link label="fork" onClick={() => store.fork()} />}
                </div>
            </div>
            <div><span style={{ color: "#5AA510" }}>fredi-bach</span>.<span style={{ color: "#C10B99" }}>{store.generalConfig.slug}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                    <span className="p-input-icon-right" style={{ margin: "16px 0" }}>
                        <Search color="#999999" size={16} />
                        <InputText placeholder="stepkey.fieldkey" />
                    </span>
                </div>
                <div style={{ paddingTop: "24px" }}>
                    <Filter color="#999999" size={20} />
                </div>
            </div>
        </div>
    )
};

export default GeneralConfig;