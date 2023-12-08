import React, { useState } from "react";
import useStagesStore from './store';
import { Button } from 'primereact/button';
import { Search } from 'lucide-react';
import { Filter } from 'lucide-react';
import { AutoComplete } from "primereact/autocomplete";
import { getAllPaths } from "./helpers";

const GeneralConfig = () => {
    const store = useStagesStore();
    const allPaths = getAllPaths(store.currentConfig)
    const [searchValue, setSearchValue] = useState('');
    const [items, setItems] = useState(allPaths);

    const search = (event) => {
        setItems(allPaths.filter(item => item.indexOf(event.query) !== -1));
    }

    return (
        <div style={{ padding: "16px 12px", backgroundColor: "#fff" }}>
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
                        <AutoComplete
                            dropdown={true}
                            dropdownIcon={<Search color="#fff" size={16} />}
                            placeholder="stepkey.fieldkey"
                            value={searchValue}
                            suggestions={items}
                            completeMethod={search} 
                            onChange={(e) => setSearchValue(e.value)}
                            onSelect={(e) => {
                                store.setSelectedElement(e.value);
                                store.setEditorTabIndex(1);
                            }}
                        />
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