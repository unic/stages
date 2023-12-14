import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import useStagesStore from '../../../../components/store';
import SidePanel from '../../../../components/SidePanel';
import Workspace from '../../../../components/Workspace';

const CommunityForm = () => {
    const {
      query: { communitySlug, formSlug },
    } = useRouter();
    const store = useStagesStore();

    useEffect(() => {
        useStagesStore.persist.rehydrate();
    }, []);

    if (!store) return <div>Something went wrong, store not found!</div>;

    console.log({ store });

    if (store.isEditMode) {
        return (
            <Splitter gutterSize={5} stateStorage="local" stateKey="stages-splitter" style={{ height: '100vh', minHeight: "100vh", maxHeight: "100vh", width: "100vw", border: "none", borderRadius: 0, background: "red" }}>
                <SplitterPanel size={78} className="flex align-items-center justify-content-center">
                    <Workspace />
                </SplitterPanel>
                <SplitterPanel minSize={22} className="flex align-items-center justify-content-center">
                    <SidePanel />
                </SplitterPanel>
            </Splitter>
        );
    }

    return <Workspace />;
};

export default CommunityForm;