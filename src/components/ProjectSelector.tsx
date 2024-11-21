import { TreeSelect } from 'antd'
import React from 'react'
import ProjectDefinition from '../models/ProjectDefinition'
import { localize } from '../utils/Language'

interface ProjectSelectorProps {
    allProjects: ProjectDefinition[]
    selectedProjectId: string
    onChange: (value: string) => void
    excludeProjectId?: string
}

interface ProjectSelectorTreeNode {
    title: string
    key: string
    value: string
    disabled?: boolean
    parentProjectId?: string
    children?: ProjectSelectorTreeNode[]
}

class ProjectSelector extends React.Component<ProjectSelectorProps> {
    render() {
        const { allProjects, selectedProjectId, onChange, excludeProjectId } =
            this.props

        const projectsMap: {
            [key: string]: ProjectSelectorTreeNode
        } = {}
        let root: ProjectSelectorTreeNode[] = []
        // Create a map of all projects
        allProjects.forEach((item) => {
            projectsMap[item.id] = {
                title: item.name,
                parentProjectId: item.parentProjectId,
                key: item.id,
                value: item.id,
            }
        })

        // Function to check if a project or its ancestors are excluded
        const isProjectOrAncestorExcluded = (projectId: string): boolean => {
            let current: string | undefined = projectId
            while (current) {
                if (current === excludeProjectId) {
                    return true
                }
                // eslint-disable-next-line no-loop-func
                current = projectsMap[current].parentProjectId
            }
            return false
        }

        // Distribute projects and apps to their respective parents or to the root
        allProjects.forEach((item) => {
            const project = projectsMap[item.id]
            if (isProjectOrAncestorExcluded(item.id)) {
                project.disabled = true
            }
            if (item.parentProjectId && projectsMap[item.parentProjectId]) {
                const children =
                    projectsMap[item.parentProjectId].children || []
                children.push(project)
                projectsMap[item.parentProjectId].children = children
            } else {
                root.push(project)
            }
        })

        root.forEach((project) => {
            if (project.children)
                project.children =
                    project.children.length > 0 ? project.children : undefined
        })
        root = [
            {
                title: localize(
                    'projects.parent_project_selector_default',
                    'root <no parent project>'
                ),
                key: '',
                value: '',
                children: root,
            },
        ]

        const handleChange = (value: string) => {
            onChange(value ?? '')
        }

        return (
            <TreeSelect
                allowClear
                style={{ width: '100%' }}
                treeDefaultExpandAll
                placeholder={localize(
                    'apps.select_parent_project',
                    'Select a parent project'
                )}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                value={selectedProjectId || ''}
                onChange={handleChange}
                treeData={root}
            />
        )
    }
}

export default ProjectSelector
