import { CSSProperties } from 'react'
import ProjectDefinition from '../models/ProjectDefinition'
import { localize } from '../utils/Language'
import ProjectSelector from './ProjectSelector'

interface ParentProjectSelectorProps {
    projects: ProjectDefinition[]
    selectedProjectId: string
    onChange: (projectId: string) => void
    excludeProjectId?: string
    style?: CSSProperties
    hideWhenEmpty?: boolean
}

export default function ParentProjectSelector(
    props: ParentProjectSelectorProps
) {
    const projects = props.projects || []
    if (projects.length === 0 && props.hideWhenEmpty !== false) {
        return <></>
    }

    return (
        <div style={props.style}>
            <div style={{ marginBottom: 5 }}>
                {localize('apps.parent_project', 'Parent project')}
            </div>
            <ProjectSelector
                allProjects={projects}
                selectedProjectId={`${props.selectedProjectId || ''}`.trim()}
                onChange={(value: string) => {
                    props.onChange(`${value || ''}`.trim())
                }}
                excludeProjectId={props.excludeProjectId || 'NONE'}
            />
        </div>
    )
}
