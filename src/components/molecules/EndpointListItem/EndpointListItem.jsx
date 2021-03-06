/*
Copyright (C) 2017  Cloudbase Solutions SRL
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// @flow

import React from 'react'
import styled from 'styled-components'
import { observer } from 'mobx-react'

import type { Endpoint } from '../../../types/Endpoint'
import Checkbox from '../../atoms/Checkbox'
import EndpointLogos from '../../atoms/EndpointLogos'
import Palette from '../../styleUtils/Palette'
import StyleProps from '../../styleUtils/StyleProps'
import DateUtils from '../../../utils/DateUtils'

import endpointImage from './images/endpoint.svg'

const CheckboxStyled = styled(Checkbox)`
  opacity: ${props => props.checked ? 1 : 0};
  transition: all ${StyleProps.animations.swift};
`
const Content = styled.div`
  display: flex;
  align-items: center;
  margin-left: 16px;
  border-top: 1px solid ${Palette.grayscale[1]};
  padding: 8px 16px;
  cursor: pointer;
  flex-grow: 1;
  transition: all ${StyleProps.animations.swift};
  min-width: 785px;

  &:hover {
    background: ${Palette.grayscale[1]};
  }
`
const Wrapper = styled.div`
  display: flex;
  align-items: center;

  &:hover ${CheckboxStyled} {
    opacity: 1;
  } }

  &:last-child ${Content} {
    border-bottom: 1px solid ${Palette.grayscale[1]};
  }
`
const Image = styled.div`
  min-width: 48px;
  height: 48px;
  background: url('${props => props.image}') no-repeat center;
  margin-right: 16px;
`
const Title = styled.div`
  flex-grow: 1;
  overflow: hidden;
  margin-right: 48px;
  min-width: 100px;
`
const TitleLabel = styled.div`
  font-size: 16px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`
const Subtitle = styled.div`
  color: ${Palette.grayscale[4]};
  margin-top: 3px;
`
const ItemLabel = styled.div`
  color: ${Palette.grayscale[4]};
`
const ItemValue = styled.div`
  color: ${Palette.primary};
`
const Created = styled.div`
  margin: 0 48px;
  min-width: 175px;
`
const Usage = styled.div`
  min-width: 244px;
`
type Props = {
  item: Endpoint,
  onClick: () => void,
  selected: boolean,
  onSelectedChange: (value: boolean) => void,
  getUsage: (item: Endpoint) => { replicasCount: number, migrationsCount: number },
}
@observer
class EndpointListItem extends React.Component<Props> {
  render() {
    return (
      <Wrapper>
        <CheckboxStyled
          data-test-id={`endpointListItem-checkbox-${this.props.item.name}`}
          checked={this.props.selected}
          onChange={this.props.onSelectedChange}
        />
        <Content onClick={this.props.onClick} data-test-id={`endpointListItem-content-${this.props.item.name}`}>
          <Image image={endpointImage} />
          <Title>
            <TitleLabel data-test-id="endpointListItem-name">{this.props.item.name}</TitleLabel>
            <Subtitle data-test-id="endpointListItem-description">{this.props.item.description || 'N/A'}</Subtitle>
          </Title>
          <EndpointLogos height={42} endpoint={this.props.item.type} />
          <Created>
            <ItemLabel>Created</ItemLabel>
            <ItemValue>
              {DateUtils.getLocalTime(this.props.item.created_at).format('DD MMMM YYYY, HH:mm')}
            </ItemValue>
          </Created>
          <Usage>
            <ItemLabel>Usage</ItemLabel>
            <ItemValue data-test-id="endpointListItem-usageCount">
              {this.props.getUsage(this.props.item).migrationsCount} migrations,&nbsp;
              {this.props.getUsage(this.props.item).replicasCount} replicas
            </ItemValue>
          </Usage>
        </Content>
      </Wrapper>
    )
  }
}

export default EndpointListItem
